/**
 * Capa de analytics de Quipu 2.0.
 *
 * Por qué existe este módulo:
 *   - Centraliza todas las llamadas a PostHog. La app nunca debe hacer
 *     `posthog.capture(...)` directamente; siempre `track()`.
 *   - Tipa el shape de cada evento con Zod para que un cambio de contrato
 *     se detecte en typecheck, no en producción.
 *   - Configura session replay, heatmaps, rage/dead clicks y autocapture
 *     en un solo lugar (`initPostHog`).
 *
 * Cómo se usa:
 *
 *   import { track, AnalyticsEvents } from "@/core/analytics";
 *
 *   track(AnalyticsEvents.EXPENSE_REGISTERED, {
 *     amount: 1200,
 *     envelope: "wants",
 *     cycle_id: "...",
 *   });
 *
 * Reglas para añadir eventos:
 *   1. Constante en `events.ts` (AnalyticsEvents.X).
 *   2. Schema Zod de las props con tipos derivados.
 *   3. Entrada en `AnalyticsEventPayloads` para que el `track()` exija
 *      las props correctas.
 *
 * No añadir lógica de UI acá. Esta capa es presentacional-inerte.
 */
