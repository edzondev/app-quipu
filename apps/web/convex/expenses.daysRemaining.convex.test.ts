import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "./_generated/api";
import {
	asTestUser,
	MS_PER_DAY,
	newConvexTest,
	seedActiveCycle,
	seedProfile,
	type TestConvex,
} from "./convexTest.helpers";
import { computeCycleDayMetrics } from "./lib/dashboardMath";

/** America/Lima has no DST: civil time is always UTC−5. Values stay in tests. */
function limaInstant(localDateTime: string): number {
	return Date.parse(`${localDateTime}-05:00`);
}

const NOW = limaInstant("2026-10-19T10:00:00");
const START = limaInstant("2026-10-01T15:00:00");
const END = limaInstant("2026-10-31T15:00:00");

describe("registerExpense days remaining", () => {
	let t: TestConvex;

	beforeEach(async () => {
		vi.useFakeTimers({ toFake: ["Date"] });
		vi.setSystemTime(NOW);
		t = newConvexTest();
		const profileId = await seedProfile(t);
		await seedActiveCycle(t, profileId, {
			startDate: START,
			endDate: END,
			envelopes: { needs: 120_000, wants: 0, savings: 0 },
		});
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("reports Lima calendar days left on a new expense and on its replay", async () => {
		const windowDays = Math.max(0, Math.ceil((END - NOW) / MS_PER_DAY));
		const limaDays = computeCycleDayMetrics(START, END, NOW).daysRemaining;
		expect(windowDays).toBe(13);
		expect(limaDays).toBe(12);

		const user = asTestUser(t);
		const registered = await user.mutation(api.expenses.registerExpense, {
			amount: 1_500,
			description: "pan",
			envelopeType: "needs",
			idempotencyKey: "draft-lima-days",
		});
		const replayed = await user.mutation(api.expenses.registerExpense, {
			amount: 1_500,
			description: "pan",
			envelopeType: "needs",
			idempotencyKey: "draft-lima-days",
		});

		expect(registered.daysRemainingInCycle).toBe(limaDays);
		expect(replayed.daysRemainingInCycle).toBe(limaDays);
		expect(replayed.expenseId).toBe(registered.expenseId);
	});
});
