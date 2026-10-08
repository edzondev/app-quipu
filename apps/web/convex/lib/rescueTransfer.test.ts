import { describe, expect, it } from "vitest";
import { computeRescueEnvelopePatches, validateRescueTransferApply } from "./rescueTransfer";

describe("validateRescueTransferApply", () => {
	it("rejects when suggestion is missing or transfer is zero", () => {
		expect(
			validateRescueTransferApply(null, {
				savingsRemaining: 5000,
				wantsRemaining: -500,
			}),
		).toEqual({ ok: false, reason: "NO_SUGGESTION" });

		expect(
			validateRescueTransferApply(
				{ transfer: 0, projectedDeficit: 500 },
				{ savingsRemaining: 5000, wantsRemaining: -500 },
			),
		).toEqual({ ok: false, reason: "NO_SUGGESTION" });
	});

	it("rejects when wants is not in deficit", () => {
		expect(
			validateRescueTransferApply(
				{ transfer: 500, projectedDeficit: 500 },
				{ savingsRemaining: 5000, wantsRemaining: 100 },
			),
		).toEqual({ ok: false, reason: "NO_RESCUE_NEEDED" });
	});

	it("rejects when savings cannot cover the transfer", () => {
		expect(
			validateRescueTransferApply(
				{ transfer: 1000, projectedDeficit: 1000 },
				{ savingsRemaining: 300, wantsRemaining: -1000 },
			),
		).toEqual({ ok: false, reason: "INSUFFICIENT_SAVINGS" });
	});

	it("accepts a valid rescue transfer", () => {
		expect(
			validateRescueTransferApply(
				{ transfer: 500, projectedDeficit: 800 },
				{ savingsRemaining: 2000, wantsRemaining: -800 },
			),
		).toEqual({ ok: true, transfer: 500 });
	});
});

describe("computeRescueEnvelopePatches", () => {
	it("moves cents from savings to wants", () => {
		expect(
			computeRescueEnvelopePatches({ savingsRemaining: 2000, wantsRemaining: -500 }, 500),
		).toEqual({ savingsRemaining: 1500, wantsRemaining: 0 });
	});
});
