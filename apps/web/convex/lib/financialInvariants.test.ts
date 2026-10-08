import { describe, expect, it } from "vitest";
import {
	applyPayFromReservations,
	applyReleaseReservation,
	resolveReservationDisplayStatus,
} from "./commitmentReservation";
import { buildCycleCorrectionTransfers } from "./cycleCorrection";
import { computeCycleSavingsBreakdown } from "./cycleSavingsBreakdown";
import { buildAllocationApplyResult } from "./incomeAllocation";
import { assertAllocationBalances } from "./moneyInvariant";
import { computeSpendableSnapshot } from "./spendableBalance";

/**
 * End-to-end domain scenarios for the allocation ledger (pure layer).
 */
describe("financial invariants", () => {
	it("no sol belongs to two destinations", () => {
		const amount = 318_237;
		const plan = {
			reservations: [{ commitmentId: "debt", amountCents: 250_000 }],
			envelopes: { needs: 40_000, wants: 10_000, savings: 8_000 },
			savingsContributions: [{ amountCents: 5_000, kind: "objective" as const }],
			leaveUnallocatedCents: 5_237,
		};
		const buckets = {
			reservedCents: 250_000,
			envelopesCents: 58_000,
			savingsContributionCents: 5_000,
			unallocatedCents: 5_237,
		};
		expect(assertAllocationBalances(amount, buckets)).toEqual({ ok: true });
		const applied = buildAllocationApplyResult({ amountCents: amount, plan });
		expect(
			applied.totals.reservedCents +
				applied.totals.envelopesCents +
				applied.totals.objectiveContributionCents +
				applied.totals.additionalContributionCents +
				applied.totals.unallocatedCents,
		).toBe(amount);
	});

	it("internal transfers conserve liquid total", () => {
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
				setEnvelopeRemaining: { needs: 5_000, wants: 5_000, savings: 0 },
				contributeToSavings: [],
				setUnallocatedCents: 89_080,
			},
		});
		expect(result.conservedLiquidMinusContributions).toBe(true);
	});

	it("reservation reduces spendable but not total liquid", () => {
		const beforeSpendable = computeSpendableSnapshot({
			needsRemainingCents: 100_00,
			wantsRemainingCents: 50_00,
			savingsRemainingCents: 0,
			unallocatedCents: 250_000,
			activeReservedCents: 0,
			daysRemaining: 10,
		});
		const afterReserve = computeSpendableSnapshot({
			needsRemainingCents: 100_00,
			wantsRemainingCents: 50_00,
			savingsRemainingCents: 0,
			unallocatedCents: 0,
			activeReservedCents: 250_000,
			daysRemaining: 10,
		});
		expect(beforeSpendable.spendableCents).toBe(afterReserve.spendableCents);
		expect(afterReserve.reservedCents).toBe(250_000);
		expect(afterReserve.unallocatedCents).toBe(0);
	});

	it("paying from reserve does not double-debit", () => {
		const pay = applyPayFromReservations({
			dueCents: 100_00,
			reservations: [
				{
					id: "r1",
					reservedCents: 100_00,
					consumedCents: 0,
					releasedCents: 0,
					status: "active",
				},
			],
		});
		expect(pay.fromReserveCents).toBe(100_00);
		expect(pay.remainderCents).toBe(0);
	});

	it("additional savings never appears without confirmed contribution", () => {
		const result = computeCycleSavingsBreakdown({
			incomeEvents: [
				{
					distributionApplied: { needs: 50, wants: 30, savings: 20 },
					distributionPolicy: "all_to_savings",
				},
			],
			surplusContributions: [],
			savingsEnvelope: { allocatedAmount: 20, remainingAmount: 20 },
		});
		expect(result.savingsAdditionalCents).toBe(0);
	});

	it("cancel reservation returns to unallocated", () => {
		const released = applyReleaseReservation({
			row: {
				reservedCents: 80_00,
				consumedCents: 0,
				releasedCents: 0,
				status: "active",
			},
		});
		expect(released.returnedToUnallocatedCents).toBe(80_00);
		expect(
			resolveReservationDisplayStatus({
				commitmentAmountCents: 80_00,
				activeReservedCents: 0,
				isPaid: false,
				isCancelled: true,
			}),
		).toBe("cancelled");
	});

	it("cent precision: allocation with odd cents balances", () => {
		const amount = 318_237;
		expect(
			buildAllocationApplyResult({
				amountCents: amount,
				plan: {
					reservations: [{ commitmentId: "c", amountCents: 250_000 }],
					envelopes: { needs: 40_000, wants: 10_000, savings: 13_000 },
					savingsContributions: [],
					leaveUnallocatedCents: 5_237,
				},
			}).totals.unallocatedCents,
		).toBe(5_237);
	});

	it("daily available from spendable excludes reserved and unallocated", () => {
		const snap = computeSpendableSnapshot({
			needsRemainingCents: 80_00,
			wantsRemainingCents: 20_00,
			savingsRemainingCents: 99_080,
			unallocatedCents: 5_000,
			activeReservedCents: 250_000,
			daysRemaining: 10,
		});
		expect(snap.dailyAvailableCents).toBe(10_00);
	});
});
