/**
 * Punto de entrada único para la capa de analytics.
 *
 * Las features y módulos deben importar de acá:
 *
 *   import { track, AnalyticsEvents, identify, reset } from "@/core/analytics";
 *   import { useFeatureFlag, usePageView } from "@/hooks/use-analytics";
 *
 * Ningún archivo fuera de `core/analytics/` debe importar `posthog-js`
 * directamente.
 */

export { initPostHog, isPosthogConfigured, posthog } from "./client";
export {
	detectDeviceType,
	detectPlatform,
	getAuthSignupContext,
} from "./client-context";
export { trackFinancialCycleTransition } from "./cycle-events";
export type {
	AdditionalSavingsSource,
	AllocationCorrectCtaSource,
	AllocationMode,
	AnalyticsEvent,
	AnalyticsEventPayloads,
	AuthProvider,
	CoachInteraction,
	CoachRecommendationType,
	CrisisAction,
	DeviceType,
	EnvelopeType,
	EspaciosPremiumPaywallSurface,
	IncomeKind,
	IncomeType,
	OnboardingStepProperties,
	PayloadFor,
	Platform,
	PlusPaywallSurface,
	SignInMethod,
} from "./events";
export { AnalyticsEvents } from "./events";
export type { FeatureFlagKey } from "./feature-flags";
export {
	FEATURE_FLAG_DEFAULTS,
	FEATURE_FLAG_VARIANT_DEFAULTS,
	FeatureFlags,
} from "./feature-flags";
export {
	daysSinceLastLogin,
	readLastLoginTimestamp,
	stampAndComputeDaysSinceLastLogin,
	writeLastLoginTimestamp,
} from "./last-login";
export {
	daysRemainingInCycle,
	mapDistributionPolicyToAllocationMode,
	mapExtraordinaryTypeToIncomeType,
	mapHabitualSourceToIncomeType,
	mapSurplusSourceToAdditionalSavingsSource,
	toEnvelopeType,
} from "./properties";
export {
	captureException,
	identify,
	reset,
	setPersonProperties,
	track,
} from "./track";
