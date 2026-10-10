import { api } from "@quipu/convex-api";
import { useQuery } from "convex/react";
import { presentSettings } from "@/shared/lib/settings/model";
import { useProfileGate } from "./use-profile-gate";

export function useSettings() {
	const { isAuthReady } = useProfileGate();
	const settings = useQuery(api.settings.getSettingsOverview, isAuthReady ? {} : "skip");
	if (!isAuthReady || settings === undefined) return { status: "loading" as const, model: null };
	if (settings == null) return { status: "empty" as const, model: null };
	return { status: "ready" as const, model: presentSettings(settings) };
}
