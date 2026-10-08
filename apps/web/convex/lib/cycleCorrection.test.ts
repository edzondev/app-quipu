import { describe, expect, it } from "vitest";
import { buildCycleCorrectionTransfers, computeLiquidTotal } from "./cycleCorrection";

describe("cycleCorrection", () => {
	it("conserves liquid when redistributing without contributions", () => {
		const before = {
			needsRemaining: 200_000,
			wantsRemaining: 50_000,
			savingsRemaining: 99_080,
			unallocatedCents: 0,
			activeReservedCents: 0,
		};
		const result = buildCycleCorrectionTransfers({
			before,
			plan: {
				reserveToCommitments: [{ commitmentId: "debt", amountCents: 250_000 }],
				setEnvelopeRemaining: {
					needs: 5_000,
					wants: 5_000,
					savings: 0,
				},
				contributeToSavings: [],
				// 349_080 − 250_000 − 5_000 − 5_000 = 89_080
				setUnallocatedCents: 89_080,
			},
		});
		expect(computeLiquidTotal(before)).toBe(349_080);
		expect(computeLiquidTotal(result.after)).toBe(349_080);
		expect(result.conservedLiquidMinusContributions).toBe(true);
	});

	it("allows confirmed contributions to leave liquid into Fondo", () => {
		const before = {
			needsRemaining: 100_00,
			wantsRemaining: 0,
			savingsRemaining: 50_00,
			unallocatedCents: 0,
			activeReservedCents: 0,
		};
		const result = buildCycleCorrectionTransfers({
			before,
			plan: {
				reserveToCommitments: [],
				setEnvelopeRemaining: { needs: 50_00, wants: 0, savings: 0 },
				contributeToSavings: [{ amountCents: 100_00, kind: "objective" }],
				setUnallocatedCents: 0,
			},
		});
		expect(result.contributionCents).toBe(100_00);
		expect(result.conservedLiquidMinusContributions).toBe(true);
	});

	it("rejects bank targets that invent liquid without declared balance", () => {
		// Quipu liquid S/373.98; bank cash to distribute S/2,005.94
		const before = {
			needsRemaining: 37_398,
			wantsRemaining: 0,
			savingsRemaining: 0,
			unallocatedCents: 0,
			activeReservedCents: 0,
		};
		const result = buildCycleCorrectionTransfers({
			before,
			plan: {
				reserveToCommitments: [{ commitmentId: "debt", amountCents: 200_000 }],
				setEnvelopeRemaining: { needs: 594, wants: 0, savings: 0 },
				contributeToSavings: [],
				setUnallocatedCents: 0,
			},
		});
		expect(computeLiquidTotal(before)).toBe(37_398);
		expect(computeLiquidTotal(result.after)).toBe(200_594);
		expect(result.conservedLiquidMinusContributions).toBe(false);
		expect(result.reconciliationDeltaCents).toBe(0);
	});

	it("reconciles declared bank liquid without inventing income or expense", () => {
		const before = {
			needsRemaining: 37_398,
			wantsRemaining: 0,
			savingsRemaining: 0,
			unallocatedCents: 0,
			activeReservedCents: 0,
		};
		const result = buildCycleCorrectionTransfers({
			before,
			plan: {
				reserveToCommitments: [{ commitmentId: "debt", amountCents: 200_000 }],
				setEnvelopeRemaining: { needs: 594, wants: 0, savings: 0 },
				contributeToSavings: [],
				setUnallocatedCents: 0,
				declaredLiquidCents: 200_594,
			},
		});
		expect(result.reconciliationDeltaCents).toBe(163_196);
		expect(result.conservedLiquidMinusContributions).toBe(true);
		expect(
			result.transfers.some(
				(row) =>
					row.kind === "liquidity_reconciliation" &&
					row.amountCents === 163_196 &&
					row.from === "bank:reconciliation" &&
					row.to === "correction:pool",
			),
		).toBe(true);
	});

	it("rejects declared liquid that does not match the target pots", () => {
		const before = {
			needsRemaining: 37_398,
			wantsRemaining: 0,
			savingsRemaining: 0,
			unallocatedCents: 0,
			activeReservedCents: 0,
		};
		expect(() =>
			buildCycleCorrectionTransfers({
				before,
				plan: {
					reserveToCommitments: [{ commitmentId: "debt", amountCents: 200_000 }],
					setEnvelopeRemaining: { needs: 594, wants: 0, savings: 0 },
					contributeToSavings: [],
					setUnallocatedCents: 0,
					declaredLiquidCents: 190_000,
				},
			}),
		).toThrow(/saldo bancario|declarado/i);
	});
});
