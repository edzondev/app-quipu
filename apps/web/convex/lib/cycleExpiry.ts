import { computeCycleCarryover } from "./cycleCarryover";

type CarryInput = Parameters<typeof computeCycleCarryover>[0];

/** Signed leftover the next habitual income carries. Extraordinary sits inside savings. */
export function signedCarryoverCents(input: CarryInput): number {
	const carry = computeCycleCarryover(input);
	return carry.needs + carry.wants + carry.savings;
}

/**
 * Read-only card for an active cycle whose `pastEnd` is already true.
 * Does not change cycle status. Move-to-Fondo still requires `status === "closed"`.
 */
export function pastEndClosedCard<TId extends string>(input: {
	pastEnd: boolean;
	cycle: {
		_id: TId;
		status: "active" | "closed";
		startDate: number;
		endDate: number;
		closeSurplusMovedAt?: number;
		carriedOverToCycleId?: string;
	};
	envelopes: CarryInput["envelopes"];
	incomeEvents: CarryInput["incomeEvents"];
	surplusContributions: CarryInput["surplusContributions"];
}): {
	cycleId: TId;
	startDate: number;
	endDate: number;
	surplusCents: number;
	surplusMovedAt: number | null;
} | null {
	if (!input.pastEnd || input.cycle.status !== "active") return null;
	return {
		cycleId: input.cycle._id,
		startDate: input.cycle.startDate,
		endDate: input.cycle.endDate,
		surplusCents: signedCarryoverCents({
			envelopes: input.envelopes,
			closeSurplusMovedAt: input.cycle.closeSurplusMovedAt,
			carriedOverToCycleId: input.cycle.carriedOverToCycleId,
			surplusContributions: input.surplusContributions,
			incomeEvents: input.incomeEvents,
		}),
		surplusMovedAt: input.cycle.closeSurplusMovedAt ?? null,
	};
}

/** The active cycle keeps the expense even when its timestamp is past `endDate`. */
export function activeCycleAcceptsExpense(
	cycle: { status: "active" | "closed"; endDate: number } | null,
	timestamp: number,
): boolean {
	if (cycle === null || cycle.status !== "active") return false;
	return Number.isFinite(timestamp);
}
