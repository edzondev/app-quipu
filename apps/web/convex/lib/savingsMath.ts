export const EMERGENCY_FUND_TARGET_MONTHS = 3;
export const MAX_SAVINGS_GOALS = 6;

export function computeMonthlyEssentialsCents(
	needsCommitments: ReadonlyArray<{ amount: number }>,
	fallbackMonthlyCents: number,
): number {
	const fromCommitments = needsCommitments.reduce((sum, commitment) => sum + commitment.amount, 0);
	if (fromCommitments > 0) return fromCommitments;
	return Math.max(0, fallbackMonthlyCents);
}

export function computeEmergencyFundTargetCents(
	monthlyEssentialsCents: number,
	months = EMERGENCY_FUND_TARGET_MONTHS,
): number {
	return Math.max(0, monthlyEssentialsCents * months);
}

export function computeMonthsCovered(
	currentAmountCents: number,
	monthlyEssentialsCents: number,
): number {
	if (monthlyEssentialsCents <= 0) return 0;
	return currentAmountCents / monthlyEssentialsCents;
}

export function computeProgressPercent(currentCents: number, targetCents: number): number {
	if (targetCents <= 0) return 0;
	return Math.min(100, Math.round((currentCents / targetCents) * 100));
}

export function computeRemainingToTarget(currentCents: number, targetCents: number): number {
	return Math.max(0, targetCents - currentCents);
}

export function computeCyclesToComplete(
	remainingCents: number,
	cycleContributionCents: number,
): number | null {
	if (remainingCents <= 0) return 0;
	if (cycleContributionCents <= 0) return null;
	return Math.ceil(remainingCents / cycleContributionCents);
}

export function buildMonthsCoveredCopy(
	monthsCovered: number,
	targetMonths = EMERGENCY_FUND_TARGET_MONTHS,
): string {
	const rounded = Math.round(monthsCovered * 10) / 10;
	const display = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);

	if (monthsCovered >= targetMonths) {
		return `${display} de ${targetMonths} meses cubiertos · meta alcanzada`;
	}
	if (monthsCovered >= 1) {
		return `${display} de ${targetMonths} meses cubiertos · vas seguro`;
	}
	if (monthsCovered > 0) {
		return `${display} de ${targetMonths} meses cubiertos · sigue construyendo`;
	}
	return `0 de ${targetMonths} meses cubiertos · empieza con calma`;
}

export function resolveEmergencyFundTargetCents(
	storedTargetCents: number | undefined,
	computedTargetCents: number,
): number {
	if (storedTargetCents !== undefined && storedTargetCents > 0) {
		return storedTargetCents;
	}
	return computedTargetCents;
}
