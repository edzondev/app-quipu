import { fixtureId } from "@/__fixtures__/convex-id";
import type { ClosedCycleSurplus } from "@/shared/components/progress/closed-cycle-surplus-card";

export const closedCycleSurplus = {
	closedCycleId: fixtureId("financialCycles", "cycle-1"),
	needs: 10000,
	wants: 6000,
	extraordinary: 5000,
	total: 21000,
	movedAt: null,
} satisfies NonNullable<ClosedCycleSurplus>;
