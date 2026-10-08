import { parseToCents } from "@/shared/lib/money";

export function buildCycleContributionSubtitle(
	cycleContributionCents: number,
	hasActiveCycle: boolean,
): string | null {
	if (!hasActiveCycle || cycleContributionCents <= 0) return null;
	return "cycle-active";
}

export function formatCyclesToCompleteLabel(cyclesToComplete: number | null): string {
	if (cyclesToComplete === null) return "—";
	if (cyclesToComplete <= 0) return "Meta alcanzada";
	return `~${cyclesToComplete} ciclos`;
}

export function parseOptionalTargetCents(input: string): number | undefined {
	const trimmed = input.trim();
	if (!trimmed) return undefined;
	const parsed = parseToCents(trimmed);
	return parsed ?? undefined;
}
