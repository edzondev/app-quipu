import { presentPlanHub } from "@/shared/lib/plan/model";
import { useAhorroPlanRow } from "./use-ahorro";
import { useDashboardSummary } from "./use-dashboard";

export function usePlanHub() {
	const summary = useDashboardSummary();
	const ahorro = useAhorroPlanRow();
	if (summary === undefined || ahorro === undefined) {
		return { status: "loading" as const, model: null, ahorro: null };
	}
	if (summary == null) return { status: "empty" as const, model: null, ahorro };
	return { status: "ready" as const, model: presentPlanHub(summary), ahorro };
}
