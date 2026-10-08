import type { Infer } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import {
	computeAvailableExtraordinarySavingsForMove,
	type ExtraordinarySavingsIncomeSlice,
} from "./extraordinarySavingsSurplus";
import {
	type ClosedCycleSurplusDestination,
	closedCycleSurplusEnvelopeValidator,
	type SurplusFromEnvelope,
} from "./surplusValidators";

export type ClosedCycleSurplusTotals = Record<
	SurplusFromEnvelope,
	{ total: number; available: number }
>;

export type ClosedCycleDispositionSlice = {
	fromEnvelope: SurplusFromEnvelope;
	amount: number;
	destinationKind: ClosedCycleSurplusDestination["kind"];
};

const SURPLUS_SOURCE_ORDER: ReadonlyArray<SurplusFromEnvelope> = [
	"needs",
	"wants",
	"extraordinary",
];

export function isOwnedSubEnvelope(
	subEnvelope: Doc<"subEnvelopes"> | null,
	profileId: Id<"profiles">,
): boolean {
	if (subEnvelope === null) return false;
	return subEnvelope.profileId === profileId;
}

/**
 * Sobrante original del ciclo cerrado, sin decrementar `remainingAmount`.
 * Los aportes extraordinarios hechos por esta asignación se reponen antes de
 * reutilizar `computeAvailableExtraordinarySavingsForMove`, porque esa función
 * resta `surplusContributions` y el cierre no mueve el sobre.
 */
export function computeClosedCycleSurplusTotals(input: {
	needsRemainingCents: number;
	wantsRemainingCents: number;
	savingsRemainingCents: number;
	incomeEvents: ReadonlyArray<ExtraordinarySavingsIncomeSlice>;
	extraordinaryContributionCents: number;
	dispositions: ReadonlyArray<ClosedCycleDispositionSlice>;
}): ClosedCycleSurplusTotals {
	const assigned: Record<SurplusFromEnvelope, number> = {
		needs: 0,
		wants: 0,
		extraordinary: 0,
	};
	let extraordinaryMovedToSubEnvelope = 0;
	for (const row of input.dispositions) {
		assigned[row.fromEnvelope] += row.amount;
		if (row.fromEnvelope === "extraordinary" && row.destinationKind === "subEnvelope") {
			extraordinaryMovedToSubEnvelope += row.amount;
		}
	}

	const preFeatureExtraordinary = Math.max(
		0,
		input.extraordinaryContributionCents - extraordinaryMovedToSubEnvelope,
	);
	const priorExtraordinaryContributions: Array<{
		fromEnvelope: SurplusFromEnvelope;
		amount: number;
	}> = [];
	if (preFeatureExtraordinary > 0) {
		priorExtraordinaryContributions.push({
			fromEnvelope: "extraordinary",
			amount: preFeatureExtraordinary,
		});
	}

	const extraordinaryTotal = computeAvailableExtraordinarySavingsForMove({
		incomeEvents: input.incomeEvents,
		surplusContributions: priorExtraordinaryContributions,
		savingsEnvelopeRemainingCents: Math.max(0, input.savingsRemainingCents),
	});
	const needsTotal = Math.max(0, input.needsRemainingCents);
	const wantsTotal = Math.max(0, input.wantsRemainingCents);

	return {
		needs: { total: needsTotal, available: needsTotal - assigned.needs },
		wants: { total: wantsTotal, available: wantsTotal - assigned.wants },
		extraordinary: {
			total: extraordinaryTotal,
			available: extraordinaryTotal - assigned.extraordinary,
		},
	};
}

export function listEnvelopesWithSurplus(
	totals: ClosedCycleSurplusTotals,
): Array<Infer<typeof closedCycleSurplusEnvelopeValidator>> {
	const rows: Array<Infer<typeof closedCycleSurplusEnvelopeValidator>> = [];
	for (const fromEnvelope of SURPLUS_SOURCE_ORDER) {
		const entry = totals[fromEnvelope];
		if (entry.total > 0) {
			rows.push({
				fromEnvelope,
				total: entry.total,
				available: entry.available,
			});
		}
	}
	return rows;
}

export function isSurplusDecided(envelopes: ReadonlyArray<{ available: number }>): boolean {
	return envelopes.every((envelope) => envelope.available === 0);
}
