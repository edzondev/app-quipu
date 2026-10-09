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

const NOW = Date.parse("2026-10-09T15:00:00.000Z");
const ENVELOPES = { needs: 50_000, wants: 30_000, savings: 20_000 };

describe("progress.getOverview chart bars", () => {
	let t: TestConvex;

	beforeEach(() => {
		vi.useFakeTimers({ toFake: ["Date"] });
		vi.setSystemTime(NOW);
		t = newConvexTest();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("flags only the closed cycles that count for the streak", async () => {
		const profileId = await seedProfile(t);
		const normalStart = NOW - 60 * MS_PER_DAY;
		const normalClose = NOW - 45 * MS_PER_DAY;
		const openingStart = NOW - 40 * MS_PER_DAY;
		const openingClose = NOW - 30 * MS_PER_DAY;
		const shortStart = NOW - 29 * MS_PER_DAY;
		const shortClose = shortStart + 6 * 60 * 60 * 1000;

		const closed = [
			{ start: normalStart, close: normalClose, isOpeningCycle: false },
			{ start: openingStart, close: openingClose, isOpeningCycle: true },
			{ start: shortStart, close: shortClose, isOpeningCycle: false },
		];
		for (const cycle of closed) {
			const cycleId = await seedActiveCycle(t, profileId, {
				startDate: cycle.start,
				endDate: cycle.close,
				status: "closed",
				isOpeningCycle: cycle.isOpeningCycle,
				envelopes: ENVELOPES,
			});
			await t.run((ctx) =>
				ctx.db.insert("cycleHistory", {
					profileId,
					cycleId,
					status: "compliant",
					evaluatedAt: cycle.close,
					wantsWithinBudget: true,
					allCommitmentsCovered: true,
				}),
			);
		}
		await seedActiveCycle(t, profileId, {
			startDate: NOW - MS_PER_DAY,
			endDate: NOW + 14 * MS_PER_DAY,
			envelopes: ENVELOPES,
		});

		const overview = await asTestUser(t).query(api.progress.getOverview, {});

		expect(overview?.chartBars.map((bar) => bar.countsForStreak).slice(-4)).toEqual([
			true,
			false,
			false,
			false,
		]);
	});

	it("returns the same bars whatever limaDay the client sends", async () => {
		const profileId = await seedProfile(t);
		await seedActiveCycle(t, profileId, {
			startDate: NOW - MS_PER_DAY,
			endDate: NOW + 14 * MS_PER_DAY,
			envelopes: ENVELOPES,
		});

		const withoutKey = await asTestUser(t).query(api.progress.getOverview, {});
		const withStaleKey = await asTestUser(t).query(api.progress.getOverview, {
			limaDay: "1999-01-01",
		});

		expect(withStaleKey).toEqual(withoutKey);
	});
});
