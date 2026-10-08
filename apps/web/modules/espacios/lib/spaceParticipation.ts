export { computeMemberParticipationCents } from "@/convex/lib/spaceParticipation";

export function participationPercent(contributedCents: number, expectedCents: number): number {
	if (expectedCents <= 0) return 0;
	return Math.min(100, Math.round((contributedCents / expectedCents) * 100));
}
