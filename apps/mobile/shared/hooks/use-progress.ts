import { api } from "@quipu/convex-api";
import { useQuery } from "convex/react";
import { presentClose, presentProgress } from "@/shared/lib/progress/model";
import { useProfileGate } from "./use-profile-gate";

export function useProgress() {
	const { isAuthReady } = useProfileGate();
	const args = isAuthReady ? {} : "skip";
	const overview = useQuery(api.progress.getOverview, args);
	const rewards = useQuery(api.progress.getRewards, args);
	const savings = useQuery(api.savings.getOverview, args);
	const closeReport = useQuery(api.cycleReport.getLatestCloseReport, args);

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
