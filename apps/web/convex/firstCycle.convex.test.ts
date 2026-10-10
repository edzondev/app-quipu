import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { limaStartOfDay } from "../shared/lib/date";
import { api } from "./_generated/api";
import {
	asTestUser,
	envelopesOf,
	newConvexTest,
	seedProfile,
	type TestConvex,
} from "./convexTest.helpers";
import { limaMidnightMs } from "./lib/firstCycleDates";

const NOW = Date.parse("2026-10-09T15:00:00.000Z");
const PAY_DAY = "2026-10-24";

describe("startFirstCycle during onboarding", () => {
	let t: TestConvex;

	beforeEach(() => {
		vi.useFakeTimers({ toFake: ["Date"] });
		vi.setSystemTime(NOW);
		t = newConvexTest();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("opens the first cycle from today to the next pay date and finishes onboarding", async () => {
		const profileId = await seedProfile(t, { onboardingComplete: false });

		const { cycleId } = await asTestUser(t).mutation(api.firstCycle.startFirstCycle, {
			openingBalanceCents: 100_000,
			nextPayDate: PAY_DAY,
		});

		const cycle = await t.run((ctx) => ctx.db.get("financialCycles", cycleId));
		expect(cycle).toMatchObject({
			profileId,
			status: "active",
			isOpeningCycle: true,
			startDate: limaStartOfDay(NOW),
			endDate: limaMidnightMs(PAY_DAY),
		});
		const envelopes = await envelopesOf(t, cycleId);
		expect(envelopes.needs.remainingAmount).toBe(50_000);
		expect(envelopes.wants.remainingAmount).toBe(30_000);
		expect(envelopes.savings.remainingAmount).toBe(20_000);
		expect(envelopes.needs.carriedOverCents).toBe(50_000);

		const profile = await t.run((ctx) => ctx.db.get("profiles", profileId));
		expect(profile?.onboardingComplete).toBe(true);
		const incomes = await t.run((ctx) => ctx.db.query("incomeEvents").collect());
		expect(incomes).toHaveLength(0);
	});

	it("is idempotent when the retry finds a cycle but onboarding was not finished", async () => {
		const profileId = await seedProfile(t, { onboardingComplete: false });
		const first = await asTestUser(t).mutation(api.firstCycle.startFirstCycle, {
			openingBalanceCents: 100_000,
			nextPayDate: PAY_DAY,
		});
		await t.run((ctx) => ctx.db.patch("profiles", profileId, { onboardingComplete: false }));

		const retry = await asTestUser(t).mutation(api.firstCycle.startFirstCycle, {
			openingBalanceCents: 100_000,
			nextPayDate: PAY_DAY,
		});

		expect(retry.cycleId).toBe(first.cycleId);
		const cycles = await t.run((ctx) => ctx.db.query("financialCycles").collect());
		expect(cycles).toHaveLength(1);
	});

	it("refuses a second first cycle once onboarding is done", async () => {
		await seedProfile(t, { onboardingComplete: false });
		await asTestUser(t).mutation(api.firstCycle.startFirstCycle, {
			openingBalanceCents: 100_000,
			nextPayDate: PAY_DAY,
		});

		await expect(
			asTestUser(t).mutation(api.firstCycle.startFirstCycle, {
				openingBalanceCents: 100_000,
				nextPayDate: PAY_DAY,
			}),
		).rejects.toMatchObject({ data: { code: "ALREADY_EXISTS" } });
	});

	it("rejects a pay date that is not between tomorrow and 31 days ahead", async () => {
		await seedProfile(t, { onboardingComplete: false });
		for (const nextPayDate of ["2026-10-09", "2026-12-01"]) {
			await expect(
				asTestUser(t).mutation(api.firstCycle.startFirstCycle, {
					openingBalanceCents: 100_000,
					nextPayDate,
				}),
			).rejects.toMatchObject({ data: { data: { field: "nextPayDate" } } });
		}
	});
});
