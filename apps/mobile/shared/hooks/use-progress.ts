import { api } from "@quipu/convex-api";
import { useQuery } from "convex/react";
import { useProgressPreview } from "@/shared/hooks/use-progress-preview";
import { presentClose, presentProgress } from "@/shared/lib/progress/model";
import { useLimaDayKey } from "./use-lima-day-key";
import { useProfileGate } from "./use-profile-gate";

export function useProgress() {
	const { isAuthReady } = useProfileGate();
	// Un escenario de prueba (solo desarrollo) reemplaza a Convex: no se consulta nada.
	const { source: preview } = useProgressPreview();
	const limaDay = useLimaDayKey();
	const live = isAuthReady && preview === null;
	const args = live ? {} : "skip";
	const overview = useQuery(api.progress.getOverview, live ? { limaDay } : "skip");
	const rewards = useQuery(api.progress.getRewards, args);
	const savings = useQuery(api.savings.getOverview, args);
	const closeReport = useQuery(api.cycleReport.getLatestCloseReport, args);

	if (preview !== null) {
		return {
			status: "ready" as const,
			progress: presentProgress(
				preview.overview,
				preview.rewards,
				preview.savings,
				preview.closeReport,
			),
			close: presentClose(preview.closeReport, preview.savings),
		};
	}

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
