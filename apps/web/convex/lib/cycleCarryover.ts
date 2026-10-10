import { ConvexError } from "convex/values";
import type { Doc } from "../_generated/dataModel";
import { closedCycleSurplusBreakdown } from "./closedCycleSurplus";
import { computeAvailableExtraordinarySavingsForMove } from "./extraordinarySavingsSurplus";

const EMPTY_CARRY = { needs: 0, wants: 0, savings: 0, extraordinary: 0 };

export function surplusWasCarriedOver(carriedOverToCycleId: string | undefined): boolean {
	return carriedOverToCycleId !== undefined;
}

export function assertSurplusNotCarriedOver(carriedOverToCycleId: string | undefined): void {
	if (!surplusWasCarriedOver(carriedOverToCycleId)) return;
	throw new ConvexError({
		code: "ALREADY_CARRIED_OVER",
		message: "El sobrante de este ciclo ya pasó a tus sobres del ciclo actual.",
		data: { field: "closedCycleId" },
	});
}

export function computeCycleCarryover(input: {
	envelopes: ReadonlyArray<Pick<Doc<"envelopes">, "type" | "remainingAmount">>;
	closeSurplusMovedAt: Doc<"financialCycles">["closeSurplusMovedAt"];
	carriedOverToCycleId?: string;
	surplusContributions: ReadonlyArray<
		Pick<Doc<"surplusContributions">, "amount" | "createdAt" | "contributionKind" | "fromEnvelope">
	>;
	incomeEvents: ReadonlyArray<Pick<Doc<"incomeEvents">, "incomeKind" | "distributionApplied">>;
}) {
	if (surplusWasCarriedOver(input.carriedOverToCycleId)) {
		return { ...EMPTY_CARRY };
	}

	const remaining = (type: Doc<"envelopes">["type"]) =>
		input.envelopes.find((envelope) => envelope.type === type)?.remainingAmount ?? 0;
	const moved = closedCycleSurplusBreakdown({
		closeSurplusMovedAt: input.closeSurplusMovedAt,
		needs: 0,
		wants: 0,
		extraordinary: 0,
		surplusContributions: input.surplusContributions,
	});
	const savings = remaining("savings") - moved.extraordinary;

	return {
		needs: remaining("needs") - moved.needs,
		wants: remaining("wants") - moved.wants,
		savings,
		extraordinary: computeAvailableExtraordinarySavingsForMove({
			incomeEvents: input.incomeEvents,
			surplusContributions: input.surplusContributions,
			savingsEnvelopeRemainingCents: Math.max(0, savings),
		}),
	};
}

/** Signed sum carried onto the next cycle's envelopes, negatives included. */
export function signedCycleSurplusCents(
	carry: Pick<ReturnType<typeof computeCycleCarryover>, "needs" | "wants" | "savings">,
): number {
	return carry.needs + carry.wants + carry.savings;
}

export function envelopeWithCarry(distributionCents: number, carriedOverCents: number) {
	const totalCents = distributionCents + carriedOverCents;
	return {
		allocatedAmount: totalCents,
		remainingAmount: totalCents,
		carriedOverCents,
	};
}

export function savingsContributionExcludingCarry(
	envelope: Pick<Doc<"envelopes">, "allocatedAmount" | "carriedOverCents"> | null,
): number {
	if (envelope === null) return 0;
	return Math.max(0, envelope.allocatedAmount - (envelope.carriedOverCents ?? 0));
}
