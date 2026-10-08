import { api } from "@quipu/convex-api";
import { useQuery } from "convex/react";
import { mapDashboardHome } from "@/shared/lib/dashboard/home-model";
import { mapSobresScreen, savingsLineFromOverview } from "@/shared/lib/dashboard/sobres-model";
import { useProfileGate } from "./use-profile-gate";

export function useDashboardSummary() {
	const { isAuthReady } = useProfileGate();
	return useQuery(api.dashboard.getSummary, isAuthReady ? {} : "skip");
}

export function useHomeModel() {
	const summary = useDashboardSummary();
	if (summary === undefined) return { status: "loading" as const };
	const home = summary ? mapDashboardHome(summary) : null;
	if (!home) return { status: "empty" as const };
	return { status: "ready" as const, home };
}

export function useSobresScreen() {
	const { isAuthReady } = useProfileGate();
	const summary = useDashboardSummary();
	const savings = useQuery(api.savings.getOverview, isAuthReady ? {} : "skip");
	if (summary === undefined) return { status: "loading" as const };
	const screen = summary ? mapSobresScreen(summary, savingsLineFromOverview(savings)) : null;
	if (!screen) return { status: "empty" as const };
	return { status: "ready" as const, screen };
}
