import { api } from "@quipu/convex-api";
import { useQuery } from "convex/react";
import { presentClose, presentProgress } from "@/shared/lib/progress/model";
import { useLimaDayKey } from "./use-lima-day-key";
import { useProfileGate } from "./use-profile-gate";

export function useProgress() {
	const { isAuthReady } = useProfileGate();
	const limaDay = useLimaDayKey();
	const overview = useQuery(api.progress.getOverview, isAuthReady ? { limaDay } : "skip");
	const rewards = useQuery(api.progress.getRewards, isAuthReady ? {} : "skip");
	const savings = useQuery(api.savings.getOverview, isAuthReady ? {} : "skip");
	const closeReport = useQuery(api.cycleReport.getLatestCloseReport, isAuthReady ? {} : "skip");

	if (
		!isAuthReady ||
		overview === undefined ||
		rewards === undefined ||
		savings === undefined ||
		closeReport === undefined
	) {
		return { status: "loading" as const, progress: null, close: null };
	}

	return {
		status: "ready" as const,
		progress: presentProgress(overview, rewards, savings, closeReport),
		close: presentClose(closeReport, savings),
	};
}
