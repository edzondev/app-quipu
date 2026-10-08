import { api } from "@quipu/convex-api";
import { useQuery } from "convex/react";
import { ahorroPlanSubtitle, presentAhorro } from "@/shared/lib/savings/model";
import { useProfileGate } from "./use-profile-gate";

export function useAhorro() {
	const { isAuthReady } = useProfileGate();
	const args = isAuthReady ? {} : "skip";
	const overview = useQuery(api.savings.getOverview, args);
	const fundDetail = useQuery(api.savings.getEmergencyFundDetail, args);
	const surplus = useQuery(api.savings.getMoveSurplusContext, args);

	if (!isAuthReady || overview === undefined || fundDetail === undefined || surplus === undefined) {
		return { status: "loading" as const, model: null };
	}

	return { status: "ready" as const, model: presentAhorro(overview, fundDetail, surplus) };
}

export function useAhorroPlanSubtitle() {
	const { isAuthReady } = useProfileGate();
	const overview = useQuery(api.savings.getOverview, isAuthReady ? {} : "skip");
	if (overview === undefined) return null;
	return ahorroPlanSubtitle(overview);
}
