import { describe, expect, it } from "vitest";
import { buildCoverageByIdFromCycleDocs } from "./loadCycleCoverageContext";

const CYCLE = {
	_id: "cycle1" as const,
	startDate: Date.UTC(2026, 0, 1),
	endDate: Date.UTC(2026, 0, 31),
	coverageBoost: undefined,
};

describe("buildCoverageByIdFromCycleDocs", () => {
	it("covers a commitment using active reservations when distributionApplied is zero", () => {
		const coverageById = buildCoverageByIdFromCycleDocs(
			{
				cycle: { ...CYCLE, _id: "cycle1" as never },
				commitments: [
					{
						_id: "rent" as never,
						amount: 250_000,
						envelope: "needs",
						dueDay: 5,
					},
				],
				incomeEvents: [
					{
						_id: "inc1" as never,
						occurredAt: Date.UTC(2026, 0, 2),
						distributionApplied: { needs: 0, wants: 0, savings: 0 },
					},
				],
				reservationRows: [
					{
						commitmentId: "rent" as never,
						reservedCents: 250_000,
						consumedCents: 0,
						releasedCents: 0,
						status: "active",
						incomeEventId: "inc1" as never,
					},
				],
			},
			Date.UTC(2026, 0, 10),
		);

		expect(coverageById.get("rent")?.status).toBe("covered");
		expect(coverageById.get("rent")?.remaining).toBe(0);
	});

	it("treats postponed commitments as covered without consuming reservations", () => {
		const coverageById = buildCoverageByIdFromCycleDocs(
			{
				cycle: { ...CYCLE, _id: "cycle1" as never },
				commitments: [
					{
						_id: "netflix" as never,
						amount: 40_000,
						envelope: "wants",
						dueDay: 18,
						postponedForCycleId: "cycle1" as never,
					},
				],
				incomeEvents: [],
				reservationRows: [],
			},
			Date.UTC(2026, 0, 10),
		);

		expect(coverageById.get("netflix")?.status).toBe("covered");
	});

	it("leaves commitment uncovered when reservations are omitted (caller bug regression)", () => {
		const withReservations = buildCoverageByIdFromCycleDocs(
			{
				cycle: { ...CYCLE, _id: "cycle1" as never },
				commitments: [
					{
						_id: "rent" as never,
						amount: 250_000,
						envelope: "needs",
						dueDay: 5,
					},
				],
				incomeEvents: [],
				reservationRows: [
					{
						commitmentId: "rent" as never,
						reservedCents: 250_000,
						consumedCents: 0,
						releasedCents: 0,
						status: "active",
					},
				],
			},
			Date.UTC(2026, 0, 10),
		);
		const withoutReservations = buildCoverageByIdFromCycleDocs(
			{
				cycle: { ...CYCLE, _id: "cycle1" as never },
				commitments: [
					{
						_id: "rent" as never,
						amount: 250_000,
						envelope: "needs",
						dueDay: 5,
					},
				],
				incomeEvents: [],
				reservationRows: [],
			},
			Date.UTC(2026, 0, 10),
		);

		expect(withReservations.get("rent")?.status).toBe("covered");
		expect(withoutReservations.get("rent")?.status).not.toBe("covered");
	});
});
