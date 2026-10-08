/**
 * Feature flags tipados para Quipu 2.0.
 *
 * El cliente PostHog resuelve `isFeatureEnabled(key)` contra el endpoint
 * `/decide/`. Los hooks en `hooks/use-analytics.ts` envuelven esa llamada
 * con caching, SSR-safety y tipado estricto.
 *
 * Para añadir un flag nuevo:
 *   1. Agregar la constante acá con tipo `FeatureFlagKey`.
 *   2. Crearlo en el dashboard de PostHog (Feature Flags → New).
 *   3. Usar `useFeatureFlag(FeatureFlags.MI_FLAG)` en el componente.
 *
 * Para un experimento A/B:
 *   1. Definir el flag como multivariate (string) en PostHog.
 *   2. Usar `useFeatureFlagVariant(KEY)` que devuelve el string variant
 *      o el fallback. Útil para ramas ("control" | "variant_a").
 *
 * Los nombres de flags siguen snake_case y prefijo por dominio cuando
 * aplique (`coach_*`, `extra_*`, `adaptive_*`).
 */

export const FeatureFlags = {
	// Onboarding
	NEW_ONBOARDING_V2: "new_onboarding_v2",

	// Coach
	COACH_ENABLED: "coach_enabled",
	CRISIS_COACH: "crisis_coach",
	EXPERIMENTAL_INSIGHTS: "experimental_insights",

	// Ingresos
	EXTRA_INCOME_ENABLED: "extra_income_enabled",

	// Ahorro
	ADAPTIVE_SAVINGS_ENABLED: "adaptive_savings_enabled",

	// Dashboard
	NEW_DASHBOARD: "new_dashboard",
} as const;

export type FeatureFlagKey = (typeof FeatureFlags)[keyof typeof FeatureFlags];

/**
 * Fallback por flag. Se usa cuando el SDK no ha cargado el flag todavía
 * (decide pendiente) o cuando el flag no existe en el proyecto. Diseña
 * cada fallback para el comportamiento "conservador" (no activar cosas
 * que el usuario no debería ver).
 */
export const FEATURE_FLAG_DEFAULTS: Record<FeatureFlagKey, boolean> = {
	[FeatureFlags.NEW_ONBOARDING_V2]: false,
	[FeatureFlags.COACH_ENABLED]: true,
	[FeatureFlags.CRISIS_COACH]: true,
	[FeatureFlags.EXPERIMENTAL_INSIGHTS]: false,
	[FeatureFlags.EXTRA_INCOME_ENABLED]: true,
	[FeatureFlags.ADAPTIVE_SAVINGS_ENABLED]: false,
	[FeatureFlags.NEW_DASHBOARD]: false,
};

/**
 * Variant por defecto para flags multivariate. La variante `control`
 * siempre debe ser segura (equivale a la versión actual del feature).
 */
export const FEATURE_FLAG_VARIANT_DEFAULTS: Record<FeatureFlagKey, string> = {
	[FeatureFlags.NEW_ONBOARDING_V2]: "control",
	[FeatureFlags.COACH_ENABLED]: "control",
	[FeatureFlags.CRISIS_COACH]: "control",
	[FeatureFlags.EXPERIMENTAL_INSIGHTS]: "control",
	[FeatureFlags.EXTRA_INCOME_ENABLED]: "control",
	[FeatureFlags.ADAPTIVE_SAVINGS_ENABLED]: "control",
	[FeatureFlags.NEW_DASHBOARD]: "control",
};
