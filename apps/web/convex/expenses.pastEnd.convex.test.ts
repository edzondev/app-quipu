import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "./_generated/api";
import {
	asTestUser,
	envelopesOf,
	MS_PER_DAY,
	newConvexTest,
	seedActiveCycle,
	seedProfile,
	type TestConvex,
} from "./convexTest.helpers";
import { computeCycleCarryover, signedCycleSurplusCents } from "./lib/cycleCarryover";
import { isCyclePastEnd } from "./lib/dashboardMath";

const NOW = Date.parse("2026-10-09T15:00:00.000Z");

describe("registerExpense after the pay date", () => {
	let t: TestConvex;

	beforeEach(() => {
		vi.useFakeTimers({ toFake: ["Date"] });
		vi.setSystemTime(NOW);
		t = newConvexTest();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("keeps the expense on the expired active cycle, which stays active and carries once", async () => {
		const profileId = await seedProfile(t);
		const endDate = NOW - 60_000;
		const needsBefore = 10_000;
		const expense = 1_500;
		const cycleId = await seedActiveCycle(t, profileId, {
			startDate: endDate - 30 * MS_PER_DAY,
			endDate,
			envelopes: { needs: needsBefore, wants: 0, savings: 0 },
		});

		const result = await asTestUser(t).mutation(api.expenses.registerExpense, {
			amount: expense,
			description: "pan",
			envelopeType: "needs",
		});

		expect(result.cycleId).toBe(cycleId);
		expect(result.remainingAmount).toBe(needsBefore - expense);

		const stored = await t.run((ctx) => ctx.db.get("expenses", result.expenseId));
		expect(stored?.cycleId).toBe(cycleId);
		expect(isCyclePastEnd(endDate, stored?.timestamp ?? 0)).toBe(true);

		const cycle = await t.run((ctx) => ctx.db.get("financialCycles", cycleId));
		expect(cycle?.status).toBe("active");
		const cycles = await t.run((ctx) => ctx.db.query("financialCycles").collect());
		expect(cycles).toHaveLength(1);

		const envelopes = await envelopesOf(t, cycleId);
		const carry = computeCycleCarryover({
			envelopes: [
				{ type: "needs", remainingAmount: envelopes.needs.remainingAmount },
				{ type: "wants", remainingAmount: envelopes.wants.remainingAmount },
				{ type: "savings", remainingAmount: envelopes.savings.remainingAmount },
			],
			closeSurplusMovedAt: undefined,
			surplusContributions: [],
			incomeEvents: [],
		});
		expect(signedCycleSurplusCents(carry)).toBe(needsBefore - expense);
	});
});
