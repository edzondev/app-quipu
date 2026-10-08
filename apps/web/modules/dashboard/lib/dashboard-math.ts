import type { StatusBadge } from "../types";

export function clampPercent(value: number): number {
	return Math.min(100, Math.max(0, value));
}

export { formatDueInDays } from "@/shared/constants/commitments";

export function formatCycleDayLine(daysElapsed: number, daysTotal: number): string {
	return `Día ${daysElapsed} de ${daysTotal}`;
}

export function getStatusBadgeClasses(status: StatusBadge): {
	container: string;
	dot: string;
} {
	switch (status) {
		case "stable":
			return {
				container: "border-qp-border bg-qp-soft text-qp-deep",
				dot: "bg-qp",
			};
		case "attention":
			return {
				container: "border-[color-mix(in_oklch,var(--qp-clay)_35%,white)] bg-clay-soft text-clay",
				dot: "bg-clay",
			};
		case "risk":
			return {
				container: "border-danger-line bg-danger-bg text-danger-ink",
				dot: "bg-danger",
			};
		case "starting":
			return {
				container: "border-qp-border bg-qp-soft text-qp-deep",
				dot: "bg-qp",
			};
		default: {
			const _exhaustive: never = status;
			return _exhaustive;
		}
	}
}

export function allCommitmentsCovered(
	commitments: Array<{ coverageStatus: "covered" | "partial" | "uncovered" }>,
): boolean {
	if (commitments.length === 0) return true;
	return commitments.every((commitment) => commitment.coverageStatus === "covered");
}

export function getInitial(name: string): string {
	const trimmed = name.trim();
	return trimmed ? trimmed.charAt(0).toUpperCase() : "Q";
}
