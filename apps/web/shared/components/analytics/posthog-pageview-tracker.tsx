"use client";

import { usePostHogPageview } from "@/hooks/use-analytics";

/** Montar una vez bajo el provider de Convex para replay, heatmaps y rutas. */
export function PostHogPageviewTracker() {
	usePostHogPageview();
	return null;
}
