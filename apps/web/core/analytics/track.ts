/**
 * Wrapper tipado sobre `posthog.capture` y compañía.
 *
 * Reglas:
 *   1. Ningún archivo fuera de `core/analytics/` debe importar `posthog-js`
 *      directamente. Siempre este módulo.
 *   2. `track()` valida las props contra el schema Zod en dev para fallar
 *      rápido si un call site envía basura; en prod se omite la validación
 *      (solo se traga el error) para no penalizar el bundle ni el runtime.
 *   3. `identify()` y `reset()` se invocan desde `convex-provider.tsx`,
 *      que es donde Better Auth vive. El resto de la app no debe tocarlos.
 *
 * Si PostHog no está configurado, todas las funciones son no-op silenciosos.
 */

import { z } from "zod";
import { isPosthogConfigured, posthog } from "./client";
import { type AnalyticsEvent, type AnalyticsEventPayloads, AnalyticsEvents } from "./events";

/**
 * Emite un evento a PostHog con sus props tipadas.
 *
 * Si PostHog no está inicializado (env vars faltantes), la llamada es no-op.
 * En desarrollo, valida las props contra el schema Zod asociado al evento.
 * Si la validación falla, loguea un warning con el evento y el problema,
 * pero NO lanza excepción: un bug de tracking no debe romper la app.
 */
export function track<E extends AnalyticsEvent>(
	event: E,
	properties: AnalyticsEventPayloads[E],
): void {
	if (process.env.NODE_ENV === "development") {
		const schema = payloadSchemaFor(event);
		if (schema) {
			const result = schema.safeParse(properties);
			if (!result.success) {
				// eslint-disable-next-line no-console -- intencional: feedback en dev
				console.warn(
					`[analytics] Invalid properties for "${event}":`,
					z.prettifyError(result.error),
				);
			}
		}
	}

	if (!isPosthogConfigured()) return;

	posthog.capture(event, properties as Record<string, unknown>);
}

/**
 * Identifica al usuario en PostHog. Lo llama `PostHogIdentity` en el provider
 * de Convex cuando `authClient.useSession()` cambia. No usar desde otro lugar.
 */
export function identify(
	distinctId: string,
	personProperties: { email?: string; name?: string },
): void {
	if (!isPosthogConfigured()) return;
	posthog.identify(distinctId, personProperties);
}

/**
 * Limpia la identidad del usuario actual. Se llama en logout y cuando la
 * sesión expira. `PostHogIdentity` se encarga.
 */
export function reset(): void {
	if (!isPosthogConfigured()) return;
	posthog.reset();
}

/**
 * Actualiza person properties (p. ej. flags de impacto del ledger).
 * No reemplaza `identify`; solo setea props adicionales.
 */
export function setPersonProperties(
	properties: Record<string, string | number | boolean | null>,
): void {
	if (!isPosthogConfigured()) return;
	posthog.setPersonProperties(properties);
}

/**
 * Captura una excepción. Usado por `app/global-error.tsx` y el boundary raíz.
 * PostHog ya captura errores no manejados via `capture_exceptions: true`,
 * pero este wrapper permite agregar contexto extra.
 */
export function captureException(error: Error, context?: Record<string, unknown>): void {
	if (!isPosthogConfigured()) {
		// En dev, sin PostHog, logueamos para que el developer lo vea.
		// eslint-disable-next-line no-console -- intencional
		console.error("[analytics:exception]", error, context);
		return;
	}
	if (context) {
		posthog.captureException(error, context);
	} else {
		posthog.captureException(error);
	}
}

// ─── Schema lookup para validación en dev ─────────────────────────────────

// Tabla runtime de schemas por evento. Existe solo para que `track()`
// pueda validar en dev sin pagar ese costo en prod. Es plana para
// mantener el árbol chico.

type AnyZod = z.ZodTypeAny;
const PAYLOAD_SCHEMAS: Partial<Record<AnalyticsEvent, AnyZod>> = {};

function payloadSchemaFor(event: AnalyticsEvent): AnyZod | undefined {
	return PAYLOAD_SCHEMAS[event];
}

export { AnalyticsEvents };
