/**
 * Inicialización del cliente PostHog para Quipu 2.0.
 *
 * Este módulo es la única fuente de verdad para la configuración del SDK.
 * Lo invoca `instrumentation-client.ts` (entrada de Next.js) una sola vez.
 *
 * Decisiones de diseño (ver `docs/QUIPU-MASTER.md` §5.4 y §8):
 *   - Session Replay activado con `maskAllInputs` y selector `data-ph-mask`
 *     para respetar el área privada (verificado en auditoría 2026-07-22).
 *   - `capture_exceptions: true` → errores JS no manejados llegan a PostHog.
 *   - `capture_pageview: false` → el dashboard es un único screen; emitimos
 *     `dashboard_viewed` manualmente con `usePageView` para controlar el shape.
 *   - `capture_pageleave: true` → engagement de salida de cada vista.
 *   - `autocapture: true` → rage clicks, dead clicks, scroll depth, console
 *     logs, network requests, JS exceptions. Heatmaps se controlan en el
 *     dashboard de PostHog; este flag las habilita en el recorder.
 *   - `defaults: "2026-01-30"` → congelado a la API de enero 2026 (no breaking
 *     changes en defaults del SDK mientras dure el release actual).
 *
 * Si las variables de entorno faltan, NO se inicializa PostHog. Las llamadas
 * a `track()` se vuelven no-op en ese caso.
 *
 * En desarrollo (`NODE_ENV === "development"`) PostHog no se inicializa ni
 * envía eventos aunque las variables existan en `.env.local`. Los feature
 * flags usan sus fallbacks locales (`FEATURE_FLAG_DEFAULTS`).
 */

import posthog, { type PostHogConfig } from "posthog-js";
import { clientEnv } from "@/core/env.client";

let initialized = false;

function hasPosthogEnv(): boolean {
	return Boolean(clientEnv.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN && clientEnv.NEXT_PUBLIC_POSTHOG_HOST);
}

/** PostHog activo: env presente y no estamos en desarrollo local. */
export function isPosthogConfigured(): boolean {
	if (process.env.NODE_ENV === "development") return false;
	return hasPosthogEnv();
}

/**
 * Inicializa el SDK. Idempotente: la segunda llamada es no-op.
 *
 * Debe llamarse solo en el cliente (browser). `instrumentation-client.ts`
 * es el único caller legítimo.
 */
export function initPostHog(): void {
	if (initialized) return;
	if (!isPosthogConfigured()) return;

	const config: Partial<PostHogConfig> = {
		api_host: clientEnv.NEXT_PUBLIC_POSTHOG_HOST,
		capture_exceptions: true,
		debug: process.env.NODE_ENV === "development",

		// Page views: los emitimos manualmente desde usePageView para
		// tipar `dashboard_viewed` con el shape que queremos. Si esto
		// quedara en `true`, PostHog dispara `$pageview` en cada navegación,
		// duplicando señal.
		capture_pageview: false,
		capture_pageleave: true,

		// Autocapture: rage/dead clicks, scroll depth, console logs,
		// network requests, JS exceptions. Heatmaps habilitadas vía SDK.
		autocapture: true,

		// Session Replay: enmascara inputs por defecto y cualquier
		// nodo con `data-ph-mask` (áreas privadas). El shell de la app
		// marcará el área sensible.
		session_recording: {
			maskAllInputs: true,
			maskTextSelector: "[data-ph-mask]",
			recordCrossOriginIframes: false,
			inlineStylesheet: true,
		},

		// API congelada a enero 2026.
		defaults: "2026-01-30",

		// Persistencia: usamos localStorage por defecto. Sin cookies
		// de terceros (CSP estricta).
		persistence: "localStorage",

		// No queremos bloqueos del LCP por el SDK.
		disable_compression: false,
		advanced_disable_decide: false,
	};

	posthog.init(clientEnv.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN ?? "", config);
	initialized = true;
}

export { posthog };
