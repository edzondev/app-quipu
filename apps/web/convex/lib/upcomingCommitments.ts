import type { CommitmentCoverageStatus } from "./commitmentCoverage";

export type UpcomingCommitmentSlice = {
	id: string;
	name: string;
	amount: number;
	remaining: number;
	dueDay: number;
	nextDueAt: number;
	daysUntilDue: number;
	cascadeStatus: CommitmentCoverageStatus;
};

const DEFAULT_WINDOW_DAYS = 3;

export function filterUpcomingCommitments(
	commitments: UpcomingCommitmentSlice[],
	_now: number,
	windowDays = DEFAULT_WINDOW_DAYS,
): UpcomingCommitmentSlice[] {
	return commitments
		.filter((commitment) => {
			if (commitment.cascadeStatus !== "partial" && commitment.cascadeStatus !== "not-started") {
				return false;
			}

			return commitment.daysUntilDue >= 0 && commitment.daysUntilDue <= windowDays;
		})
		.sort((a, b) => {
			const dueDiff = a.daysUntilDue - b.daysUntilDue;
			if (dueDiff !== 0) return dueDiff;
			return a.name.localeCompare(b.name, "es");
		});
}

export function buildUpcomingBadgeLabel(count: number): string | null {
	if (count <= 0) return null;
	if (count === 1) return "1 vence pronto";
	return `${count} vencen pronto`;
}
