import { api } from "@quipu/convex-api";
import { useQuery } from "convex/react";
import { presentPlanHub } from "@/shared/lib/plan/model";
import { ahorroPlanRow } from "@/shared/lib/savings/model";
import { useDashboardSummary } from "./use-dashboard";
import { useProfileGate } from "./use-profile-gate";

export function usePlanHub() {
	const { isAuthReady } = useProfileGate();
	const summary = useDashboardSummary();
	const settings = useQuery(api.settings.getSettingsOverview, isAuthReady ? {} : "skip");
	const overview = useQuery(api.savings.getOverview, isAuthReady ? {} : "skip");
	if (!isAuthReady || summary === undefined || settings === undefined || overview === undefined) {
		return { status: "loading" as const, model: null, ahorro: null };
	}
	const ahorro = ahorroPlanRow(overview);
	if (summary == null) return { status: "empty" as const, model: null, ahorro };
	return { status: "ready" as const, model: presentPlanHub(summary, settings), ahorro };
}
