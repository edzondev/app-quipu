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

const NOW = Date.parse("2026-10-09T15:00:00.000Z");

describe("registerExpense idempotency", () => {
	let t: TestConvex;

	beforeEach(async () => {
		vi.useFakeTimers({ toFake: ["Date"] });
		vi.setSystemTime(NOW);
		t = newConvexTest();
		const profileId = await seedProfile(t);
		await seedActiveCycle(t, profileId, {
			startDate: NOW - 2 * MS_PER_DAY,
			endDate: NOW + 13 * MS_PER_DAY,
			envelopes: { needs: 10_000, wants: 5_000, savings: 0 },
		});
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("returns the existing row and does not deduct twice when the same key is retried", async () => {
		const user = asTestUser(t);
		const args = {
			amount: 1_500,
			description: "pan",
			envelopeType: "needs" as const,
			idempotencyKey: "draft-pan-1",
		};

		const first = await user.mutation(api.expenses.registerExpense, args);
		const retry = await user.mutation(api.expenses.registerExpense, args);

		expect(retry.expenseId).toBe(first.expenseId);
		expect(retry.remainingAmount).toBe(first.remainingAmount);
		expect(retry.amount).toBe(1_500);

		const expenses = await t.run((ctx) => ctx.db.query("expenses").collect());
		expect(expenses).toHaveLength(1);
		expect(expenses[0]?.idempotencyKey).toBe("draft-pan-1");

		const envelopes = await envelopesOf(t, first.cycleId);
		expect(envelopes.needs.remainingAmount).toBe(8_500);
	});

	it("creates a second expense when the draft key is different", async () => {
		const user = asTestUser(t);
		const first = await user.mutation(api.expenses.registerExpense, {
			amount: 200,
			description: "bus",
			envelopeType: "wants",
			idempotencyKey: "draft-a",
		});
		const second = await user.mutation(api.expenses.registerExpense, {
			amount: 200,
			description: "bus",
			envelopeType: "wants",
			idempotencyKey: "draft-b",
		});

		expect(second.expenseId).not.toBe(first.expenseId);
		const expenses = await t.run((ctx) => ctx.db.query("expenses").collect());
		expect(expenses).toHaveLength(2);
		const envelopes = await envelopesOf(t, first.cycleId);
		expect(envelopes.wants.remainingAmount).toBe(4_600);
	});
});
