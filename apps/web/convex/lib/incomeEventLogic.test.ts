import { describe, expect, it } from "vitest";
import { resolveCycleForEvent } from "./incomeEventLogic";

const HOUR = 60 * 60 * 1000;
const _DAY = 24 * HOUR;

describe("resolveCycleForEvent", () => {
	const now = new Date("2026-07-15T12:00:00Z").getTime();
	const cycleStart = new Date("2026-07-01T00:00:00Z").getTime();
	const cycleEnd = new Date("2026-07-31T00:00:00Z").getTime();

	it("returns the active cycle when occurredAt is within range", () => {
		const result = resolveCycleForEvent({
			activeCycle: { _id: "active", startDate: cycleStart, endDate: cycleEnd },
			occurredAt: new Date("2026-07-10T00:00:00Z").getTime(),
			now,
		});
		expect(result).toBe("active");
	});

	it("returns null (create new cycle) when no active cycle", () => {
		const result = resolveCycleForEvent({
			activeCycle: null,
			occurredAt: now,
			now,
		});
		expect(result).toBeNull();
	});

	it("returns null when occurredAt is before the active cycle", () => {
		// Event happened last month, no closed cycle in scope: create a new one.
		const result = resolveCycleForEvent({
			activeCycle: { _id: "active", startDate: cycleStart, endDate: cycleEnd },
			occurredAt: new Date("2026-06-15T00:00:00Z").getTime(),
			now,
		});
		expect(result).toBeNull();
	});

	it("returns null when occurredAt is after the active cycle", () => {
		const result = resolveCycleForEvent({
			activeCycle: { _id: "active", startDate: cycleStart, endDate: cycleEnd },
			occurredAt: new Date("2026-08-15T00:00:00Z").getTime(),
			now,
		});
		expect(result).toBeNull();
	});
});
