import { api } from "@quipu/convex-api";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useRef } from "react";
import { mapDashboardHome } from "@/shared/lib/dashboard/home-model";
import { mapSobresScreen, savingsLineFromOverview } from "@/shared/lib/dashboard/sobres-model";
import { currencySymbol } from "@/shared/lib/money";
import { profileInitial } from "@/shared/lib/settings/model";
import { useProfileGate } from "./use-profile-gate";

export function useDashboardSummary() {
	const { isAuthReady } = useProfileGate();
	return useQuery(api.dashboard.getSummary, isAuthReady ? {} : "skip");
}

function useCloseExpiredCycle(enabled: boolean) {
	const closeExpired = useMutation(api.cycleExpiry.closeExpired);
	const started = useRef(false);
	useEffect(() => {
		if (!enabled || started.current) return;
		started.current = true;
		void Promise.resolve(closeExpired({})).catch(() => undefined);
	}, [closeExpired, enabled]);
}

export function useHomeModel() {
	const summary = useDashboardSummary();
	useCloseExpiredCycle(summary != null);
	if (summary === undefined) return { status: "loading" as const };
	const profileName = summary?.profile.name ?? "";
	const initial = profileInitial(profileName);
	if (!summary) return { status: "empty" as const, profileName, profileInitial: initial };
	const home = mapDashboardHome(summary);
	if (home) {
		return { status: "ready" as const, home, profileName, profileInitial: initial };
	}
	if (summary.closedCycle) {
		return {
			status: "closed" as const,
			closedCycle: summary.closedCycle,
			profileName,
			profileInitial: initial,
			currencySymbol: currencySymbol(summary.profile.currencyCode),
		};
	}
	return { status: "empty" as const, profileName, profileInitial: initial };
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
