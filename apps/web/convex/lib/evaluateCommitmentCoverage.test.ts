import { describe, expect, it } from "vitest";
import { persistableCoveredBy } from "./evaluateCommitmentCoverage";
import { buildCoverageByIdFromCycleDocs } from "./loadCycleCoverageContext";

const CYCLE = {
	_id: "cycle1" as never,
	startDate: Date.UTC(2026, 9, 9),
	endDate: Date.UTC(2026, 9, 31),
	coverageBoost: undefined,
};

describe("persistableCoveredBy", () => {
	it("descarta las fuentes virtuales: boost, reservación y arrastre", () => {
		expect(
			persistableCoveredBy([
				{ eventId: "__boost_needs__", amount: 1 },
				{ eventId: "__reservation_rent__", amount: 1 },
				{ eventId: "__carry_needs__", amount: 1 },
				{ eventId: "__carry_wants__", amount: 1 },
				{ eventId: "inc123", amount: 1 },
			]),
		).toEqual(["inc123"]);
	});

	it("primer ciclo: el dinero de hoy llega como arrastre y no deja ids inválidos en coveredBy", () => {
		const coverage = buildCoverageByIdFromCycleDocs(
			{
				cycle: CYCLE,
				commitments: [
					{ _id: "agua" as never, amount: 2_900, envelope: "needs", dueDay: 29 },
					{ _id: "gimnasio" as never, amount: 6_900, envelope: "needs", dueDay: 30 },
				],
				incomeEvents: [],
				reservationRows: [],
				envelopes: [
					{ type: "needs", carriedOverCents: 250_000 },
					{ type: "wants", carriedOverCents: 150_000 },
				],
			},
			Date.UTC(2026, 9, 9),
		);

		for (const id of ["agua", "gimnasio"]) {
			const funding = coverage.get(id)?.fundingEvents ?? [];
			expect(coverage.get(id)?.status).toBe("covered");
			expect(funding.some((event) => event.eventId === "__carry_needs__")).toBe(true);
			expect(persistableCoveredBy(funding)).toEqual([]);
		}
	});
});
