import { describe, expect, it } from "vitest";
import type { Id } from "../_generated/dataModel";
import { planIncomeDeleteLedgerReverse } from "./incomeDeleteReverse";

describe("planIncomeDeleteLedgerReverse", () => {
	it("collects unallocated, reservations and savings reversals", () => {
		const plan = planIncomeDeleteLedgerReverse([
			{
				destination: "unallocated",
				amountCents: 5_237,
			},
			{
				destination: "commitment_reservation",
				amountCents: 250_000,
				reservationId: "r1" as Id<"commitmentReservations">,
			},
			{
				destination: "savings_contribution",
				amountCents: 10_000,
				subEnvelopeId: "s1" as Id<"subEnvelopes">,
				contributionKind: "objective",
			},
			{
				destination: "envelope_needs",
				amountCents: 40_000,
			},
		]);

		expect(plan.unallocatedDeltaCents).toBe(5_237);
		expect(plan.reservationIdsToRelease).toEqual(["r1"]);
		expect(plan.subEnvelopeReversals).toEqual([{ subEnvelopeId: "s1", amountCents: 10_000 }]);
	});

	it("ignores zero amounts", () => {
		const plan = planIncomeDeleteLedgerReverse([{ destination: "unallocated", amountCents: 0 }]);
		expect(plan.unallocatedDeltaCents).toBe(0);
	});
});
