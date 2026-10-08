/**
 * Hooks reutilizables para analytics y feature flags.
 *
 * Se exportan desde `@/hooks/use-analytics` (este archivo).
 *
 * Convenciones:
 *   - `usePostHogPageview` emite `$pageview` para replay/heatmaps (URLs reales).
 *   - Los eventos de producto (`dashboard_viewed`, etc.) se emiten con `track()`
 *     en los módulos de dominio, no desde el matcher de rutas.
 */

"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { isPosthogConfigured, posthog } from "@/core/analytics";

/**
 * Emite `$pageview` en cada cambio de ruta. Complementa `capture_pageview: false`
 * en `initPostHog` para no duplicar eventos de producto con pageviews genéricos.
 */
export function usePostHogPageview(): void {
	const pathname = usePathname();

	useEffect(() => {
		if (!pathname || !isPosthogConfigured()) return;
		if (typeof window === "undefined") return;

		posthog.capture("$pageview", {
			$current_url: window.location.href,
			pathname,
		});
	}, [pathname]);
}
