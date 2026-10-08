import { getLimaDay } from "../../shared/lib/date";
import { suggestRescueTransfer } from "./budgetMath";
import {
	type CrisisCommitmentSlice,
	computeCoverFromSavingsSplit,
	pickPostponeCandidate,
} from "./crisisResolution";

const DEFAULT_FREEZE_DAYS = 3;

export type CrisisPlanStepKind =
	| "postpone"
	| "cover_from_savings"
	| "rescue_transfer"
	| "freeze_wants";

export type CrisisPlanStep = {
	kind: CrisisPlanStepKind;
	order: number;
	label: string;
	commitmentId?: string;
	transferTotal?: number;
	needsBoost?: number;
	wantsBoost?: number;
	rescueTransfer?: number;
	freezeDays?: number;
};

export type CrisisPlan = {
	steps: CrisisPlanStep[];
	projectedCushionCents: number;
	cycleEndDay: number;
	outcomeLabel: string;
	canFullyResolve: boolean;
};

function formatAmount(cents: number, currencySymbol: string): string {
	return `${currencySymbol} ${(cents / 100).toLocaleString("es-PE", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	})}`;
}

function computeUncoveredByEnvelope(commitments: CrisisCommitmentSlice[]): {
	needs: number;
	wants: number;
	total: number;
} {
	return commitments.reduce(
		(acc, commitment) => {
			if (commitment.remaining <= 0) return acc;
			acc[commitment.envelope] += commitment.remaining;
			acc.total += commitment.remaining;
			return acc;
		},
		{ needs: 0, wants: 0, total: 0 },
	);
}

function simulateAfterPostpone(
	commitments: CrisisCommitmentSlice[],
	commitmentId: string,
): CrisisCommitmentSlice[] {
	return commitments.map((commitment) =>
		commitment.id === commitmentId ? { ...commitment, remaining: 0 } : commitment,
	);
}

function applyCoverToCommitments(
	commitments: CrisisCommitmentSlice[],
	split: { needs: number; wants: number },
): CrisisCommitmentSlice[] {
	let needsBoostLeft = split.needs;
	let wantsBoostLeft = split.wants;

	return commitments.map((commitment) => {
		if (commitment.remaining <= 0) return commitment;

		if (commitment.envelope === "needs" && needsBoostLeft > 0) {
			const applied = Math.min(commitment.remaining, needsBoostLeft);
			needsBoostLeft -= applied;
			return { ...commitment, remaining: commitment.remaining - applied };
		}

		if (commitment.envelope === "wants" && wantsBoostLeft > 0) {
			const applied = Math.min(commitment.remaining, wantsBoostLeft);
			wantsBoostLeft -= applied;
			return { ...commitment, remaining: commitment.remaining - applied };
		}

		return commitment;
	});
}

export function computeProjectedCushion(params: {
	savingsRemaining: number;
	needsRemaining: number;
	wantsRemaining: number;
	uncoveredTotal: number;
}): number {
	const envelopeSurplus =
		Math.max(0, params.savingsRemaining) +
		Math.max(0, params.needsRemaining) +
		Math.max(0, params.wantsRemaining);

	return Math.max(0, envelopeSurplus - params.uncoveredTotal);
}

export function buildCrisisPlan(params: {
	commitments: CrisisCommitmentSlice[];
	savingsRemaining: number;
	wantsRemaining: number;
	needsRemaining: number;
	cycleEndDate: number;
	currencySymbol?: string;
	freezeDays?: number;
}): CrisisPlan | null {
	const {
		commitments,
		savingsRemaining: initialSavings,
		wantsRemaining: initialWants,
		needsRemaining: initialNeeds,
		cycleEndDate,
		currencySymbol = "S/",
		freezeDays = DEFAULT_FREEZE_DAYS,
	} = params;

	let simulatedCommitments = [...commitments];
	let savings = initialSavings;
	let wants = initialWants;
	let needs = initialNeeds;

	const initialUncovered = computeUncoveredByEnvelope(simulatedCommitments);
	if (initialUncovered.total <= 0 && initialWants >= 0) {
		return null;
	}

	const steps: CrisisPlanStep[] = [];
	let order = 1;

	const postponeCandidate = pickPostponeCandidate(simulatedCommitments);
	if (postponeCandidate && postponeCandidate.remaining > 0) {
		steps.push({
			kind: "postpone",
			order: order++,
			label: `Posponer ${postponeCandidate.name} (${formatAmount(postponeCandidate.remaining, currencySymbol)})`,
			commitmentId: postponeCandidate.id,
		});
		simulatedCommitments = simulateAfterPostpone(simulatedCommitments, postponeCandidate.id);
	}

	const uncoveredAfterPostpone = computeUncoveredByEnvelope(simulatedCommitments);
	const coverSplit = computeCoverFromSavingsSplit(
		{
			needs: uncoveredAfterPostpone.needs,
			wants: uncoveredAfterPostpone.wants,
		},
		savings,
	);

	if (coverSplit.total > 0) {
		steps.push({
			kind: "cover_from_savings",
			order: order++,
			label: `Mover ${formatAmount(coverSplit.total, currencySymbol)} del Ahorro del ciclo`,
			transferTotal: coverSplit.total,
			needsBoost: coverSplit.needs,
			wantsBoost: coverSplit.wants,
		});
		savings -= coverSplit.total;
		needs += coverSplit.needs;
		wants += coverSplit.wants;
		simulatedCommitments = applyCoverToCommitments(simulatedCommitments, {
			needs: coverSplit.needs,
			wants: coverSplit.wants,
		});
	}

	const rescue = suggestRescueTransfer(savings, wants);
	if (rescue.transfer > 0) {
		steps.push({
			kind: "rescue_transfer",
			order: order++,
			label: `Transferir ${formatAmount(rescue.transfer, currencySymbol)} a Gustos`,
			rescueTransfer: rescue.transfer,
		});
		savings -= rescue.transfer;
		wants += rescue.transfer;
	}

	const monetarySteps = steps.length;
	const shouldFreeze =
		monetarySteps > 0 &&
		(initialWants < 0 || uncoveredAfterPostpone.wants > 0 || rescue.transfer > 0);

	if (shouldFreeze) {
		steps.push({
			kind: "freeze_wants",
			order: order++,
			label: `Congelar Gustos ${freezeDays} días`,
			freezeDays,
		});
	}

	if (steps.length === 0) {
		return null;
	}

	const finalUncovered = computeUncoveredByEnvelope(simulatedCommitments);
	const projectedCushionCents = computeProjectedCushion({
		savingsRemaining: savings,
		needsRemaining: needs,
		wantsRemaining: wants,
		uncoveredTotal: finalUncovered.total,
	});
	const cycleEndDay = getLimaDay(cycleEndDate);
	const canFullyResolve = finalUncovered.total <= 0 && wants >= 0;
	const outcomeLabel = canFullyResolve
		? `llegas al ${cycleEndDay} con ${formatAmount(projectedCushionCents, currencySymbol)} de colchón`
		: `reduces la presión, pero aún faltan ${formatAmount(finalUncovered.total, currencySymbol)}`;

	return {
		steps,
		projectedCushionCents,
		cycleEndDay,
		outcomeLabel,
		canFullyResolve,
	};
}
