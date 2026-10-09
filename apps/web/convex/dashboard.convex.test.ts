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

function surplusOf(summary: unknown): number | undefined {
	if (summary === null || typeof summary !== "object") return undefined;
	return "surplusCents" in summary && typeof summary.surplusCents === "number"
		? summary.surplusCents
		: undefined;
}

async function summaryWithEnvelopes(
	t: TestConvex,
	envelopes: { needs: number; wants: number; savings: number },
) {
	const profileId = await seedProfile(t);
	await seedActiveCycle(t, profileId, {
		startDate: NOW - 5 * MS_PER_DAY,
		endDate: NOW + 10 * MS_PER_DAY,
		envelopes,
	});
	return asTestUser(t).query(api.dashboard.getSummary, {});
}

describe("dashboard.getSummary surplus", () => {
	let t: TestConvex;

	beforeEach(() => {
		vi.useFakeTimers({ toFake: ["Date"] });
		vi.setSystemTime(NOW);
		t = newConvexTest();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("returns the sum of what is left in the envelopes", async () => {
		const summary = await summaryWithEnvelopes(t, {
			needs: 50_000,
			wants: 30_000,
			savings: 20_000,
		});

		expect(surplusOf(summary)).toBe(100_000);
	});

	it("returns a negative surplus, not clamped to zero, when the person overspent", async () => {
		const summary = await summaryWithEnvelopes(t, {
			needs: 10_000,
			wants: -25_000,
			savings: 5_000,
		});

		expect(surplusOf(summary)).toBe(-10_000);
	});

	it("ignores the limaDay cache key and decides with the server clock", async () => {
		const profileId = await seedProfile(t);
		await seedActiveCycle(t, profileId, {
			startDate: NOW - 5 * MS_PER_DAY,
			endDate: NOW + 10 * MS_PER_DAY,
			envelopes: { needs: 50_000, wants: 30_000, savings: 20_000 },
		});

		const withoutKey = await asTestUser(t).query(api.dashboard.getSummary, {});
		const withStaleKey = await asTestUser(t).query(api.dashboard.getSummary, {
			limaDay: "1999-01-01",
		});

		expect(withStaleKey).toEqual(withoutKey);
	});
});
