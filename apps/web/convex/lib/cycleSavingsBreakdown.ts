import type { DistributionPolicy } from "../../shared/lib/allocations";

const LIMA_TIMEZONE = "America/Lima";
const CYCLE_CONTEXT_MONTH_FORMATTER = new Intl.DateTimeFormat("es-PE", {
	timeZone: LIMA_TIMEZONE,
	month: "long",
});

export type CycleSavingsIncomeEvent = {
	incomeKind?: "habitual" | "extraordinary";
	distributionPolicy?: DistributionPolicy;
	distributionApplied: {
		needs: number;
		wants: number;
		savings: number;
	};
};

export type SurplusContributionSlice = {
	amount: number;
	fromEnvelope?: "needs" | "wants" | "extraordinary";
	contributionKind?: "objective" | "additional";
};

export type AllocationContributionLine = {
	destination: string;
	amountCents: number;
	contributionKind?: "objective" | "additional";
};

export type SavingsEnvelopeSlice = {
	allocatedAmount: number;
	remainingAmount: number;
};

export type CycleSavingsBreakdownNumbers = {
	/** Planned into the cycle savings envelope (target), not yet necessarily in Fondo. */
	savingsObjectiveTargetCents: number;
	/** Confirmed contributions toward the cycle objective. */
	savingsObjectiveContributedCents: number;
	/** Confirmed additional contributions only (never inferred from unspent). */
	savingsAdditionalCents: number;
	/** Real money contributed this cycle (objective + additional). */
	savingsCycleContributedCents: number;
	/** Still sitting in the cycle savings envelope (not yet moved to Fondo/metas). */
	savingsEnvelopeRemainingCents: number;
	/**
	 * Display alias: aportado hacia la meta del ciclo (contributed, not target).
	 * Kept so existing UI can migrate field-by-field.
	 */
	savingsObjectiveCents: number;
	/** Display alias for savingsCycleContributedCents. */
	savingsTotalCents: number;
	objectiveBarPercent: number;
	additionalBarPercent: number;
	status: "on_track" | "above_objective" | "below_objective";
	/** Money moved out of the savings envelope toward Fondo (legacy set-aside). */
	savingsSetAsideCents: number;
	objectiveProgressPercent: number;
};

/** Planned objective target = Σ savings allocated via profile_default / habitual. */
export function countsTowardSavingsObjective(
	distributionPolicy: DistributionPolicy | undefined,
): boolean {
	return distributionPolicy !== "all_to_savings";
}

export function sumObjectiveTargetFromEvents(
	incomeEvents: ReadonlyArray<CycleSavingsIncomeEvent>,
): number {
	return incomeEvents.reduce((sum, event) => {
		// all_to_savings increases the savings envelope as a plan, but it is NOT
		// "ahorro adicional" until the user confirms a contribution.
		return sum + Math.max(0, event.distributionApplied.savings);
	}, 0);
}

/** @deprecated Use sumObjectiveTargetFromEvents — name kept for call-site grep. */
export function sumObjectiveSavingsFromEvents(
	incomeEvents: ReadonlyArray<CycleSavingsIncomeEvent>,
): number {
	return incomeEvents
		.filter((event) => countsTowardSavingsObjective(event.distributionPolicy))
		.reduce((sum, event) => sum + Math.max(0, event.distributionApplied.savings), 0);
}

/**
 * Additional savings are ONLY confirmed surplus/contribution rows.
 * `all_to_savings` income events no longer inflate "ahorro adicional".
 */
export function sumAdditionalSavingsFromContributions(
	surplusContributions: ReadonlyArray<SurplusContributionSlice>,
	allocationLines: ReadonlyArray<AllocationContributionLine> = [],
): number {
	const fromSurplus = surplusContributions.reduce((sum, row) => {
		const kind = row.contributionKind ?? "additional";
		if (kind !== "additional") return sum;
		return sum + Math.max(0, row.amount);
	}, 0);

	const fromLines = allocationLines.reduce((sum, line) => {
		if (line.destination !== "savings_contribution") return sum;
		if (line.contributionKind !== "additional") return sum;
		return sum + Math.max(0, line.amountCents);
	}, 0);

	return fromSurplus + fromLines;
}

/** @deprecated Prefer sumAdditionalSavingsFromContributions. */
export function sumAdditionalSavingsFromEvents(
	_incomeEvents: ReadonlyArray<CycleSavingsIncomeEvent>,
): number {
	return 0;
}

export function sumSurplusContributionAmounts(
	surplusContributions: ReadonlyArray<SurplusContributionSlice>,
): number {
	return surplusContributions.reduce((sum, row) => sum + Math.max(0, row.amount), 0);
}

export function sumObjectiveContributionLines(
	allocationLines: ReadonlyArray<AllocationContributionLine>,
): number {
	return allocationLines.reduce((sum, line) => {
		if (line.destination !== "savings_contribution") return sum;
		if (line.contributionKind !== "objective") return sum;
		return sum + Math.max(0, line.amountCents);
	}, 0);
}

export function sumObjectiveSurplusContributions(
	surplusContributions: ReadonlyArray<SurplusContributionSlice>,
): number {
	return surplusContributions.reduce((sum, row) => {
		if (row.contributionKind !== "objective") return sum;
		return sum + Math.max(0, row.amount);
	}, 0);
}

/** Moved from cycle savings envelope into sub-envelopes (allocated − remaining). */
export function computeSavingsSetAsideCents(envelope: SavingsEnvelopeSlice): number {
	return Math.max(0, envelope.allocatedAmount - envelope.remainingAmount);
}

export function computeObjectiveProgressPercent(
	savingsSetAsideCents: number,
	savingsObjectiveCents: number,
): number {
	if (savingsObjectiveCents <= 0) return 0;
	return Math.min(100, Math.round((savingsSetAsideCents / savingsObjectiveCents) * 100));
}

export function computeObjectiveAdditionalBarPercents(
	savingsObjectiveCents: number,
	savingsTotalCents: number,
): { objectiveBarPercent: number; additionalBarPercent: number } {
	if (savingsTotalCents <= 0) {
		return { objectiveBarPercent: 0, additionalBarPercent: 0 };
	}
	const objectiveBarPercent = Math.min(100, (savingsObjectiveCents / savingsTotalCents) * 100);
	return {
		objectiveBarPercent,
		additionalBarPercent: 100 - objectiveBarPercent,
	};
}

export function computeCycleSavingsBreakdown(input: {
	incomeEvents: ReadonlyArray<CycleSavingsIncomeEvent>;
	surplusContributions?: ReadonlyArray<SurplusContributionSlice>;
	allocationLines?: ReadonlyArray<AllocationContributionLine>;
	savingsEnvelope?: SavingsEnvelopeSlice | null;
}): CycleSavingsBreakdownNumbers {
	const surplusContributions = input.surplusContributions ?? [];
	const allocationLines = input.allocationLines ?? [];

	const savingsObjectiveTargetCents = sumObjectiveTargetFromEvents(input.incomeEvents);

	const savingsSetAsideCents = input.savingsEnvelope
		? computeSavingsSetAsideCents(input.savingsEnvelope)
		: 0;
	const savingsEnvelopeRemainingCents = Math.max(0, input.savingsEnvelope?.remainingAmount ?? 0);

	const savingsObjectiveContributedCents =
		sumObjectiveContributionLines(allocationLines) +
		sumObjectiveSurplusContributions(surplusContributions);

	const savingsAdditionalCents = sumAdditionalSavingsFromContributions(
		surplusContributions,
		allocationLines,
	);

	const savingsCycleContributedCents = savingsObjectiveContributedCents + savingsAdditionalCents;

	const savingsObjectiveCents = savingsObjectiveContributedCents;
	const savingsTotalCents = savingsCycleContributedCents;

	const objectiveProgressPercent = computeObjectiveProgressPercent(
		savingsObjectiveContributedCents,
		savingsObjectiveTargetCents,
	);

	const isUnderObjective =
		savingsObjectiveTargetCents > 0 &&
		savingsObjectiveContributedCents < savingsObjectiveTargetCents;

	let status: CycleSavingsBreakdownNumbers["status"] = "on_track";
	if (savingsAdditionalCents > 0) {
		status = "above_objective";
	} else if (isUnderObjective) {
		status = "below_objective";
	}

	const { objectiveBarPercent, additionalBarPercent } = computeObjectiveAdditionalBarPercents(
		savingsObjectiveContributedCents,
		savingsCycleContributedCents,
	);

	return {
		savingsObjectiveTargetCents,
		savingsObjectiveContributedCents,
		savingsAdditionalCents,
		savingsCycleContributedCents,
		savingsEnvelopeRemainingCents,
		savingsObjectiveCents,
		savingsTotalCents,
		objectiveBarPercent,
		additionalBarPercent,
		status,
		savingsSetAsideCents,
		objectiveProgressPercent,
	};
}

export function buildCycleSavingsContextLabel(
	cycleStartDate: number,
	events: ReadonlyArray<CycleSavingsIncomeEvent>,
): string {
	const month = CYCLE_CONTEXT_MONTH_FORMATTER.format(new Date(cycleStartDate));
	const monthCapitalized = month.charAt(0).toUpperCase() + month.slice(1);

	const hasHabitual = events.some((event) => event.incomeKind !== "extraordinary");
	const hasExtraordinary = events.some((event) => event.incomeKind === "extraordinary");

	let incomeHint = "sin ingresos aún";
	if (hasHabitual && hasExtraordinary) {
		incomeHint = "sueldo + gratificación";
	} else if (hasHabitual) {
		incomeHint = "sueldo";
	} else if (hasExtraordinary) {
		incomeHint = "ingreso extraordinario";
	}

	return `${monthCapitalized} · ${incomeHint}`;
}
