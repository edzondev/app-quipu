import { api } from "@quipu/convex-api";
import { useQuery } from "convex/react";
import { ahorroPlanRow, presentAhorro } from "@/shared/lib/savings/model";
import { useProfileGate } from "./use-profile-gate";

export function useAhorro() {
	const { isAuthReady } = useProfileGate();
	const args = isAuthReady ? {} : "skip";
	const overview = useQuery(api.savings.getOverview, args);
	const surplus = useQuery(api.savings.getMoveSurplusContext, args);

	if (!isAuthReady || overview === undefined || surplus === undefined) {
		return { status: "loading" as const, model: null };
	}

	return { status: "ready" as const, model: presentAhorro(overview, surplus) };
}

export function useAhorroPlanRow() {
	const { isAuthReady } = useProfileGate();
	const overview = useQuery(api.savings.getOverview, isAuthReady ? {} : "skip");
	if (!isAuthReady || overview === undefined) return undefined;
	return ahorroPlanRow(overview);
}
