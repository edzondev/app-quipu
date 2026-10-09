import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { limaStartOfDay } from "../shared/lib/date";
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

const DAY_ONE = Date.parse("2026-10-09T15:00:00.000Z");
const DAY_TWO = Date.parse("2026-10-10T15:00:00.000Z");

function extraArgs(overrides: Record<string, unknown> = {}) {
	return {
		amount: 50_000,
		source: "other" as const,
		description: "Extra",
		occurredAt: DAY_ONE,
		incomeKind: "extraordinary" as const,
		...overrides,
	};
}

describe("createIncomeEvent, extraordinary, through the real validators", () => {
	let t: TestConvex;

	beforeEach(async () => {
		vi.useFakeTimers({ toFake: ["Date"] });
		vi.setSystemTime(DAY_ONE);
		t = newConvexTest();
		const profileId = await seedProfile(t);
		await seedActiveCycle(t, profileId, {
			startDate: DAY_ONE - 2 * MS_PER_DAY,
			endDate: DAY_ONE + 13 * MS_PER_DAY,
			envelopes: { needs: 50_000, wants: 30_000, savings: 20_000 },
		});
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("accepts a custom type with its own label and profile_default", async () => {
		const result = await asTestUser(t).mutation(
			api.incomeEvents.createIncomeEvent,
			extraArgs({
				extraordinaryType: "custom",
				extraordinaryLabel: "Venta de laptop",
				distributionPolicy: "profile_default",
				description: "Venta de laptop",
			}),
		);
		expect(result.isNewCycle).toBe(false);
		expect(result.distributionApplied).toEqual({ needs: 25_000, wants: 15_000, savings: 10_000 });
		const stored = await t.run((ctx) => ctx.db.get("incomeEvents", result.eventId));
		expect(stored).toMatchObject({
			incomeKind: "extraordinary",
			extraordinaryType: "custom",
			extraordinaryLabel: "Venta de laptop",
			distributionPolicy: "profile_default",
		});
	});

	it("accepts the generic «Extra» exactly as the app sends it", async () => {
		const result = await asTestUser(t).mutation(
			api.incomeEvents.createIncomeEvent,
			extraArgs({
				extraordinaryType: "custom",
				extraordinaryLabel: "Extra",
				distributionPolicy: "profile_default",
			}),
		);
		expect(result.description).toBe("Extra");
		expect(result.source).toBe("other");
		expect(result.distributionApplied).toEqual({ needs: 25_000, wants: 15_000, savings: 10_000 });
	});

	it("accepts a typed extra with profile_default and no label", async () => {
		const result = await asTestUser(t).mutation(
			api.incomeEvents.createIncomeEvent,
			extraArgs({
				source: "payroll",
				description: "Gratificación de julio",
				extraordinaryType: "gratification_july",
				distributionPolicy: "profile_default",
			}),
		);
		expect(result.source).toBe("payroll");
		expect(result.distributableCents).toBe(50_000);
	});

	it("sends everything to savings with all_to_savings", async () => {
		const result = await asTestUser(t).mutation(
			api.incomeEvents.createIncomeEvent,
			extraArgs({
				extraordinaryType: "custom",
				extraordinaryLabel: "Extra",
				distributionPolicy: "all_to_savings",
			}),
		);
		expect(result.distributionApplied).toEqual({ needs: 0, wants: 0, savings: 50_000 });
	});

	it("fails without extraordinaryType", async () => {
		await expect(
			asTestUser(t).mutation(
				api.incomeEvents.createIncomeEvent,
				extraArgs({ distributionPolicy: "profile_default" }),
			),
		).rejects.toMatchObject({
			data: { code: "VALIDATION_ERROR", data: { field: "extraordinaryType" } },
		});
	});

	it("fails without distributionPolicy when no rule can decide", async () => {
		await expect(
			asTestUser(t).mutation(
				api.incomeEvents.createIncomeEvent,
				extraArgs({ extraordinaryType: "custom", extraordinaryLabel: "Extra" }),
			),
		).rejects.toMatchObject({
			data: { code: "VALIDATION_ERROR", data: { field: "distributionPolicy" } },
		});
	});

	it("fails a label outside custom", async () => {
		await expect(
			asTestUser(t).mutation(
				api.incomeEvents.createIncomeEvent,
				extraArgs({
					extraordinaryType: "cts",
					extraordinaryLabel: "Extra",
					distributionPolicy: "profile_default",
				}),
			),
		).rejects.toMatchObject({
			data: { code: "VALIDATION_ERROR", data: { field: "extraordinaryLabel" } },
		});
	});

	it("rejects a type the argument validator does not know", async () => {
		await expect(
			asTestUser(t).mutation(
				api.incomeEvents.createIncomeEvent,
				extraArgs({
					extraordinaryType: "lottery",
					distributionPolicy: "profile_default",
				}) as never,
			),
		).rejects.toThrow(/Validator error/);
	});
});

describe("createIncomeEvent, habitual, across Lima days", () => {
	let t: TestConvex;

	beforeEach(() => {
		vi.useFakeTimers({ toFake: ["Date"] });
		vi.setSystemTime(DAY_ONE);
		t = newConvexTest();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	function habitual(amount: number, occurredAt: number) {
		return {
			amount,
			source: "payroll" as const,
			description: "Sueldo",
			occurredAt,
			incomeKind: "habitual" as const,
		};
	}

	it("adds to the cycle that started that Lima day, then closes it the next day and carries once", async () => {
		const profileId = await seedProfile(t);
		const start = limaStartOfDay(DAY_ONE);
		const firstCycleId = await seedActiveCycle(t, profileId, {
			startDate: start,
			endDate: start + 15 * MS_PER_DAY,
		});
		const user = asTestUser(t);

		const sameDay = await user.mutation(
			api.incomeEvents.createIncomeEvent,
			habitual(100_000, DAY_ONE),
		);
		expect(sameDay.isNewCycle).toBe(false);
		expect(sameDay.cycleId).toBe(firstCycleId);
		await user.mutation(api.expenses.registerExpense, {
			amount: 10_000,
			description: "cena",
			envelopeType: "wants",
		});
		const firstEnvelopes = await envelopesOf(t, firstCycleId);
		expect(firstEnvelopes.needs.remainingAmount).toBe(50_000);
		expect(firstEnvelopes.wants.remainingAmount).toBe(20_000);
		expect(firstEnvelopes.savings.remainingAmount).toBe(20_000);

		vi.setSystemTime(DAY_TWO);
		const nextDay = await user.mutation(
			api.incomeEvents.createIncomeEvent,
			habitual(200_000, DAY_TWO),
		);
		expect(nextDay.isNewCycle).toBe(true);
		expect(nextDay.cycleId).not.toBe(firstCycleId);

		const [closed, opened, history] = await t.run(async (ctx) => [
			await ctx.db.get("financialCycles", firstCycleId),
			await ctx.db.get("financialCycles", nextDay.cycleId),
			await ctx.db.query("cycleHistory").collect(),
		]);
		expect(closed).toMatchObject({ status: "closed", carriedOverToCycleId: nextDay.cycleId });
		expect(opened).toMatchObject({ status: "active", carriedOverFromCycleId: firstCycleId });
		expect(history).toHaveLength(1);

		const carried = await envelopesOf(t, nextDay.cycleId);
		expect(carried.needs.carriedOverCents).toBe(50_000);
		expect(carried.wants.carriedOverCents).toBe(20_000);
		expect(carried.savings.carriedOverCents).toBe(20_000);
		expect(carried.needs.remainingAmount).toBe(50_000 + 100_000);
		expect(carried.wants.remainingAmount).toBe(20_000 + 60_000);
		expect(carried.savings.remainingAmount).toBe(20_000 + 40_000);

		const sameDayAgain = await user.mutation(
			api.incomeEvents.createIncomeEvent,
			habitual(10_000, DAY_TWO),
		);
		expect(sameDayAgain.isNewCycle).toBe(false);
		expect(sameDayAgain.cycleId).toBe(nextDay.cycleId);
		const afterAgain = await envelopesOf(t, nextDay.cycleId);
		expect(afterAgain.needs.carriedOverCents).toBe(50_000);
		expect(afterAgain.wants.carriedOverCents).toBe(20_000);
		expect(afterAgain.savings.carriedOverCents).toBe(20_000);
		const total =
			afterAgain.needs.remainingAmount +
			afterAgain.wants.remainingAmount +
			afterAgain.savings.remainingAmount;
		expect(total).toBe(90_000 + 200_000 + 10_000);
		const cycles = await t.run((ctx) => ctx.db.query("financialCycles").collect());
		expect(cycles).toHaveLength(2);
	});
});
