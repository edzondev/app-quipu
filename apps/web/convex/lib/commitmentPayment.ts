import type { Id } from "../_generated/dataModel";
import { isPastNextDue } from "./commitmentDueDate";

export type CommitmentPaymentStatus = "paid" | "pending" | "overdue";

export function isCommitmentPaidForCycle(
	commitment: {
		paidAt?: number;
		paidForCycleId?: Id<"financialCycles">;
	},
	activeCycleId: Id<"financialCycles"> | null,
): boolean {
	return (
		commitment.paidAt != null &&
		activeCycleId != null &&
		commitment.paidForCycleId === activeCycleId
	);
}

/**
 * Tracks whether the user confirmed paying the obligation for the current due.
 * Independent from cascade coverage — does not move envelope balances.
 */
export function resolveCommitmentPaymentStatus(params: {
	paidAt?: number;
	paidForCycleId?: Id<"financialCycles">;
	activeCycleId: Id<"financialCycles"> | null;
	nextDueAt: number;
	now: number;
}): CommitmentPaymentStatus {
	if (
		isCommitmentPaidForCycle(
			{
				paidAt: params.paidAt,
				paidForCycleId: params.paidForCycleId,
			},
			params.activeCycleId,
		)
	) {
		return "paid";
	}

	if (params.activeCycleId == null) {
		return "pending";
	}

	if (isPastNextDue(params.nextDueAt, params.now)) {
		return "overdue";
	}

	return "pending";
}
