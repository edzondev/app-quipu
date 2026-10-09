import type { api } from "@quipu/convex-api";
import type { FunctionReturnType } from "convex/server";

type DashboardSummary = NonNullable<FunctionReturnType<typeof api.dashboard.getSummary>>;

/** loading: la query no resolvió. none: cycle === null. pastEnd: el campo del servidor. */
export type IncomeCycleOffer = "loading" | "none" | "open" | "pastEnd";

export function incomeCycleOffer(summary: DashboardSummary | null | undefined): IncomeCycleOffer {
	if (summary == null) return "loading";
	if (summary.cycle === null) return "none";
	if (summary.cycle.pastEnd === true) return "pastEnd";
	return "open";
}
