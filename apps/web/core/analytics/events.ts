/**
 * Constantes y tipos para los eventos de PostHog de Quipu 2.0.
 *
 * Reglas:
 *   1. Nunca usar strings literales para nombres de eventos. Siempre `AnalyticsEvents.X`.
 *   2. Las propiedades se tipan con Zod y se exportan como tipos via `z.infer`.
 *   3. Cualquier evento nuevo: agregar constante + schema + tipo en el mapa de payloads.
 *   4. Si una propiedad es dinero, va en **céntimos enteros** (consistente con `shared/lib/money`).
 *
 * Los nombres de eventos siguen snake_case (convención PostHog). Las propiedades
 * también snake_case, salvo que provengan de un campo tipado del schema (en ese
 * caso se mantiene la grafía del backend: `allocation_needs`, `cycle_id`).
 */

import { z } from "zod";

// ─── Enums compartidos ──────────────────────────────────────────────────────

export const AuthProviderSchema = z.enum(["email", "google", "apple"]);
export type AuthProvider = z.infer<typeof AuthProviderSchema>;

export const DeviceTypeSchema = z.enum(["mobile", "tablet", "desktop"]);
export type DeviceType = z.infer<typeof DeviceTypeSchema>;

export const PlatformSchema = z.enum(["android", "ios", "web"]);
export type Platform = z.infer<typeof PlatformSchema>;

export const SignInMethodSchema = z.enum(["password", "passkey"]);
export type SignInMethod = z.infer<typeof SignInMethodSchema>;

export const EnvelopeTypeSchema = z.enum(["needs", "wants", "savings"]);
export type EnvelopeType = z.infer<typeof EnvelopeTypeSchema>;

export const IncomeKindSchema = z.enum(["habitual", "extraordinary"]);
export type IncomeKind = z.infer<typeof IncomeKindSchema>;

export const IncomeTypeSchema = z.enum([
	"salary",
	"gratification",
	"cts",
	"bonus",
	"utilities",
	"freelance",
	"other",
]);
export type IncomeType = z.infer<typeof IncomeTypeSchema>;

export const AllocationModeSchema = z.enum(["default", "manual", "all_to_savings"]);
export type AllocationMode = z.infer<typeof AllocationModeSchema>;

export const AdditionalSavingsSourceSchema = z.enum([
	"salary",
	"gratification",
	"cts",
	"bonus",
	"needs",
	"wants",
	"extraordinary",
]);
export type AdditionalSavingsSource = z.infer<typeof AdditionalSavingsSourceSchema>;

export const CoachRecommendationTypeSchema = z.enum([
	"rescue_transfer",
	"freeze_wants",
	"adjust_cycle",
	"save_more",
	"insight",
]);
export type CoachRecommendationType = z.infer<typeof CoachRecommendationTypeSchema>;

export const CoachInteractionSchema = z.enum(["selected", "dismissed"]);
export type CoachInteraction = z.infer<typeof CoachInteractionSchema>;

export const CrisisActionSchema = z.enum(["completed", "dismissed", "postponed"]);
export type CrisisAction = z.infer<typeof CrisisActionSchema>;

// ─── Schemas de propiedades por evento ─────────────────────────────────────

const UserSignedUpProperties = z.object({
	provider: AuthProviderSchema,
	device_type: DeviceTypeSchema.optional(),
	platform: PlatformSchema.optional(),
});
export type UserSignedUpProperties = z.infer<typeof UserSignedUpProperties>;

const UserLoggedInProperties = z.object({
	method: SignInMethodSchema,
	days_since_last_login: z.number().int().nonnegative(),
});
export type UserLoggedInProperties = z.infer<typeof UserLoggedInProperties>;

const PasskeyCreatedProperties = z.strictObject({});
export type PasskeyCreatedProperties = z.infer<typeof PasskeyCreatedProperties>;

const OnboardingStepProperties = z.object({
	step: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal("success")]),
});
export type OnboardingStepProperties = z.infer<typeof OnboardingStepProperties>;

const OnboardingCompletedProperties = z.object({
	worker_type: z.enum(["dependent", "independent", "mixed"]),
	pay_frequency: z.enum(["monthly", "biweekly", "weekly", "variable"]).optional(),
	allocation_needs: z.number().int().min(0).max(100),
	allocation_wants: z.number().int().min(0).max(100),
	allocation_savings: z.number().int().min(0).max(100),
	onboarding_duration_seconds: z.number().int().nonnegative(),
});
export type OnboardingCompletedProperties = z.infer<typeof OnboardingCompletedProperties>;

const OnboardingAbandonedProperties = z.object({
	last_step: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal("success")]),
});
export type OnboardingAbandonedProperties = z.infer<typeof OnboardingAbandonedProperties>;

const DashboardViewedProperties = z.object({
	cycle_id: z.string().optional(),
	is_new_cycle: z.boolean().optional(),
	days_remaining: z.number().int().nonnegative().optional(),
	/** Ciclo marcado por migración/edición: números posiblemente inflados. */
	needs_review: z.boolean().optional(),
	reserved_cents: z.number().int().nonnegative().optional(),
	unallocated_cents: z.number().int().nonnegative().optional(),
});
export type DashboardViewedProperties = z.infer<typeof DashboardViewedProperties>;

const EnvelopeOpenedProperties = z.object({
	envelope_type: EnvelopeTypeSchema,
	sub_envelope_id: z.string().optional(),
});
export type EnvelopeOpenedProperties = z.infer<typeof EnvelopeOpenedProperties>;

const FinancialCycleProperties = z.object({
	cycle_id: z.string(),
	days_in_cycle: z.number().int().positive().optional(),
});
export type FinancialCycleProperties = z.infer<typeof FinancialCycleProperties>;

const IncomeRegisteredProperties = z.object({
	amount: z.number().int().positive(),
	envelope: EnvelopeTypeSchema,
	income_kind: IncomeKindSchema,
	income_type: IncomeTypeSchema,
	allocation_mode: AllocationModeSchema,
	cycle_id: z.string(),
	days_remaining_in_cycle: z.number().int().nonnegative().optional(),
	is_first_income: z.boolean().optional(),
	/** True cuando el cliente envió `allocation` explícita (ledger). */
	used_explicit_allocation: z.boolean().optional(),
	reserved_cents: z.number().int().nonnegative().optional(),
	unallocated_cents: z.number().int().nonnegative().optional(),
});
export type IncomeRegisteredProperties = z.infer<typeof IncomeRegisteredProperties>;

export const AllocationCorrectCtaSourceSchema = z.enum([
	"dashboard_banner",
	"dashboard_hint",
	"settings",
	"delete_income",
]);
export type AllocationCorrectCtaSource = z.infer<typeof AllocationCorrectCtaSourceSchema>;

const AllocationReviewSurfacedProperties = z.object({
	cycle_id: z.string(),
	reserved_cents: z.number().int().nonnegative().optional(),
	unallocated_cents: z.number().int().nonnegative().optional(),
	spendable_cents: z.number().int().nonnegative().optional(),
});
export type AllocationReviewSurfacedProperties = z.infer<typeof AllocationReviewSurfacedProperties>;

const AllocationCorrectCtaClickedProperties = z.object({
	source: AllocationCorrectCtaSourceSchema,
	cycle_id: z.string().optional(),
	needs_review: z.boolean().optional(),
});
export type AllocationCorrectCtaClickedProperties = z.infer<
	typeof AllocationCorrectCtaClickedProperties
>;

const AllocationCorrectStartedProperties = z.object({
	cycle_id: z.string(),
	needs_review: z.boolean().optional(),
	reserved_cents: z.number().int().nonnegative().optional(),
	unallocated_cents: z.number().int().nonnegative().optional(),
});
export type AllocationCorrectStartedProperties = z.infer<typeof AllocationCorrectStartedProperties>;

const AllocationCorrectCompletedProperties = z.object({
	cycle_id: z.string(),
	needs_review_before: z.boolean().optional(),
	reserved_cents: z.number().int().nonnegative().optional(),
	unallocated_cents: z.number().int().nonnegative().optional(),
	contribute_cents: z.number().int().nonnegative().optional(),
	contribute_kind: z.enum(["objective", "additional"]).optional(),
	/** Bank vs Quipu gap absorbed by liquidity_reconciliation (can be negative). */
	reconciliation_delta_cents: z.number().int().optional(),
});
export type AllocationCorrectCompletedProperties = z.infer<
	typeof AllocationCorrectCompletedProperties
>;

const IncomeEventUpdatedProperties = z.object({
	cycle_id: z.string().optional(),
	amount: z.number().int().positive(),
	previous_amount: z.number().int().positive().optional(),
	income_kind: IncomeKindSchema.optional(),
});
export type IncomeEventUpdatedProperties = z.infer<typeof IncomeEventUpdatedProperties>;

const MovementDeletedProperties = z.object({
	movement_kind: z.enum(["income", "expense"]),
	amount: z.number().int().positive().optional(),
	preferred_correct_shown: z.boolean().optional(),
});
export type MovementDeletedProperties = z.infer<typeof MovementDeletedProperties>;

const ExtraIncomeRegisteredProperties = z.object({
	amount: z.number().int().positive(),
	type: z.enum(["gratification", "cts", "bonus", "utilities", "other"]),
	cycle_id: z.string(),
	distribution_policy: AllocationModeSchema,
});
export type ExtraIncomeRegisteredProperties = z.infer<typeof ExtraIncomeRegisteredProperties>;

const ExpenseRegisteredProperties = z.object({
	amount: z.number().int().positive(),
	envelope: EnvelopeTypeSchema,
	category: z.string().optional(),
	cycle_id: z.string().optional(),
	days_remaining_in_cycle: z.number().int().nonnegative().optional(),
	entry_variant: z.enum(["fab", "envelope", "auto"]).optional(),
});
export type ExpenseRegisteredProperties = z.infer<typeof ExpenseRegisteredProperties>;

const SavingsGoalCreatedProperties = z.object({
	goal_id: z.string().optional(),
	label: z.string().optional(),
	has_target: z.boolean(),
	target_amount: z.number().int().nonnegative().optional(),
});
export type SavingsGoalCreatedProperties = z.infer<typeof SavingsGoalCreatedProperties>;

const AdditionalSavingsAddedProperties = z.object({
	amount: z.number().int().positive(),
	source: AdditionalSavingsSourceSchema,
	previous_target_percentage: z.number().int().min(0).max(100).optional(),
	goal_id: z.string().optional(),
});
export type AdditionalSavingsAddedProperties = z.infer<typeof AdditionalSavingsAddedProperties>;

const SavingsContributionCompletedProperties = z.object({
	amount: z.number().int().positive(),
	source_envelope: z.enum(["needs", "wants"]),
	goal_id: z.string(),
	goal_label: z.string().optional(),
	is_emergency_fund: z.boolean(),
});
export type SavingsContributionCompletedProperties = z.infer<
	typeof SavingsContributionCompletedProperties
>;

const FixedCommitmentCreatedProperties = z.object({
	envelope: z.enum(["needs", "wants"]),
	due_day: z.number().int().min(1).max(31),
	amount: z.number().int().positive(),
	commitment_id: z.string().optional(),
});
export type FixedCommitmentCreatedProperties = z.infer<typeof FixedCommitmentCreatedProperties>;

const AllocationModifiedProperties = z.object({
	previous_needs: z.number().int().min(0).max(100),
	previous_wants: z.number().int().min(0).max(100),
	previous_savings: z.number().int().min(0).max(100),
	new_needs: z.number().int().min(0).max(100),
	new_wants: z.number().int().min(0).max(100),
	new_savings: z.number().int().min(0).max(100),
	trigger: z.enum(["settings", "onboarding", "coach"]),
});
export type AllocationModifiedProperties = z.infer<typeof AllocationModifiedProperties>;

const CoachRecommendationInteractedProperties = z.object({
	recommendation_type: CoachRecommendationTypeSchema,
	interaction: CoachInteractionSchema,
	trigger_event: z.string().optional(),
	transfer_amount: z.number().int().nonnegative().optional(),
});
export type CoachRecommendationInteractedProperties = z.infer<
	typeof CoachRecommendationInteractedProperties
>;

const CrisisRecommendationResolvedProperties = z.object({
	action: CrisisActionSchema,
	option_id: z.string(),
	cycle_id: z.string().optional(),
});
export type CrisisRecommendationResolvedProperties = z.infer<
	typeof CrisisRecommendationResolvedProperties
>;

const NotificationInteractedProperties = z.object({
	notification_id: z.string().optional(),
	notification_type: z.string().optional(),
});
export type NotificationInteractedProperties = z.infer<typeof NotificationInteractedProperties>;

const SummaryViewedProperties = z.object({
	period: z.enum(["weekly", "monthly"]),
	cycle_id: z.string().optional(),
});
export type SummaryViewedProperties = z.infer<typeof SummaryViewedProperties>;

const FinancialInsightViewedProperties = z.object({
	insight_type: z.string(),
	cycle_id: z.string().optional(),
});
export type FinancialInsightViewedProperties = z.infer<typeof FinancialInsightViewedProperties>;

const FeedbackSubmittedProperties = z.object({
	category: z.enum(["problem", "improvement", "question"]),
	message_length: z.number().int().positive(),
	has_page_path: z.boolean(),
});
export type FeedbackSubmittedProperties = z.infer<typeof FeedbackSubmittedProperties>;

export const PlusPaywallSurfaceSchema = z.enum([
	"settings_plan",
	"premium_lock_card",
	"premium_lock_prompt",
	"coach",
	"forecast",
	"auto_apply",
]);
export type PlusPaywallSurface = z.infer<typeof PlusPaywallSurfaceSchema>;

export const EspaciosPremiumPaywallSurfaceSchema = z.enum(["hub", "readonly", "create"]);
export type EspaciosPremiumPaywallSurface = z.infer<typeof EspaciosPremiumPaywallSurfaceSchema>;

export const BillingIntervalSchema = z.enum(["monthly", "yearly"]);
export type BillingInterval = z.infer<typeof BillingIntervalSchema>;

export const SpaceStatusSchema = z.enum(["active", "readonly", "closed"]);
export type SpaceStatus = z.infer<typeof SpaceStatusSchema>;

export const SpaceProposalKindSchema = z.enum([
	"allocation",
	"cycle_duration",
	"expected_contribution",
]);
export type SpaceProposalKindAnalytics = z.infer<typeof SpaceProposalKindSchema>;

export const SpaceEnvelopeTypeSchema = z.enum(["needs", "wants", "savings"]);
export type SpaceEnvelopeTypeAnalytics = z.infer<typeof SpaceEnvelopeTypeSchema>;

const PlusPaywallViewedProperties = z.object({
	surface: PlusPaywallSurfaceSchema,
	plan: z.enum(["free", "premium"]),
});
export type PlusPaywallViewedProperties = z.infer<typeof PlusPaywallViewedProperties>;

const PlusCheckoutStartedProperties = z.object({
	interval: BillingIntervalSchema,
	currency: z.string().min(3).max(3),
});
export type PlusCheckoutStartedProperties = z.infer<typeof PlusCheckoutStartedProperties>;

const PlusCheckoutCompletedProperties = z.object({
	interval: BillingIntervalSchema.optional(),
	currency: z.string().min(3).max(3),
});
export type PlusCheckoutCompletedProperties = z.infer<typeof PlusCheckoutCompletedProperties>;

const PlusPortalOpenedProperties = z.strictObject({});
export type PlusPortalOpenedProperties = z.infer<typeof PlusPortalOpenedProperties>;

const EspaciosHubViewedProperties = z.object({
	has_space: z.boolean(),
	is_premium: z.boolean(),
	space_count: z.number().int().nonnegative(),
});
export type EspaciosHubViewedProperties = z.infer<typeof EspaciosHubViewedProperties>;

const EspaciosPremiumPaywallViewedProperties = z.object({
	surface: EspaciosPremiumPaywallSurfaceSchema,
});
export type EspaciosPremiumPaywallViewedProperties = z.infer<
	typeof EspaciosPremiumPaywallViewedProperties
>;

const SpaceCreatedProperties = z.object({
	space_id: z.string(),
});
export type SpaceCreatedProperties = z.infer<typeof SpaceCreatedProperties>;

const SpaceInviteAcceptedProperties = z.object({
	space_id: z.string(),
});
export type SpaceInviteAcceptedProperties = z.infer<typeof SpaceInviteAcceptedProperties>;

const SpaceDashboardViewedProperties = z.object({
	space_id: z.string(),
	status: SpaceStatusSchema,
	member_count: z.number().int().positive(),
});
export type SpaceDashboardViewedProperties = z.infer<typeof SpaceDashboardViewedProperties>;

const SpaceExpenseRegisteredProperties = z.object({
	space_id: z.string(),
	amount: z.number().int().positive(),
	envelope: SpaceEnvelopeTypeSchema,
	funding_source: z.enum(["space_budget", "personal_pocket"]),
});
export type SpaceExpenseRegisteredProperties = z.infer<typeof SpaceExpenseRegisteredProperties>;

const SpaceContributionCompletedProperties = z.object({
	space_id: z.string(),
	amount: z.number().int().positive(),
	personal_envelope: SpaceEnvelopeTypeSchema,
	space_envelope: SpaceEnvelopeTypeSchema,
});
export type SpaceContributionCompletedProperties = z.infer<
	typeof SpaceContributionCompletedProperties
>;

const SpaceProposalEventProperties = z.object({
	space_id: z.string(),
	proposal_kind: SpaceProposalKindSchema,
});
export type SpaceProposalEventProperties = z.infer<typeof SpaceProposalEventProperties>;

const SpaceLifecycleProperties = z.object({
	space_id: z.string(),
});
export type SpaceLifecycleProperties = z.infer<typeof SpaceLifecycleProperties>;

const FeedbackEntryClickedProperties = z.object({
	variant: z.enum(["sidebar", "drawer", "mobile"]),
});
export type FeedbackEntryClickedProperties = z.infer<typeof FeedbackEntryClickedProperties>;

// ─── Constantes de eventos ─────────────────────────────────────────────────

export const AnalyticsEvents = {
	// Auth
	USER_SIGNED_UP: "user_signed_up",
	USER_LOGGED_IN: "user_logged_in",
	USER_LOGGED_OUT: "user_logged_out",
	PASSKEY_CREATED: "passkey_created",

	// Onboarding
	ONBOARDING_STARTED: "onboarding_started",
	ONBOARDING_STEP_VIEWED: "onboarding_step_viewed",
	ONBOARDING_STEP_COMPLETED: "onboarding_step_completed",
	ONBOARDING_COMPLETED: "onboarding_completed",
	ONBOARDING_ABANDONED: "onboarding_abandoned",

	// Navegación
	DASHBOARD_VIEWED: "dashboard_viewed",
	ENVELOPE_OPENED: "envelope_opened",
	FINANCIAL_CYCLE_STARTED: "financial_cycle_started",
	FINANCIAL_CYCLE_CLOSED: "financial_cycle_closed",

	// Ingresos
	INCOME_REGISTERED: "income_registered",
	EXTRA_INCOME_REGISTERED: "extra_income_registered",

	// Gastos
	EXPENSE_REGISTERED: "expense_registered",

	// Ahorro
	SAVINGS_GOAL_CREATED: "savings_goal_created",
	ADDITIONAL_SAVINGS_ADDED: "additional_savings_added",
	SAVINGS_CONTRIBUTION_COMPLETED: "savings_contribution_completed",

	// Compromisos
	FIXED_COMMITMENT_CREATED: "fixed_commitment_created",

	// Cambios de estrategia
	ALLOCATION_MODIFIED: "allocation_modified",

	// Allocation ledger / rescate de ciclos inflados
	ALLOCATION_REVIEW_SURFACED: "allocation_review_surfaced",
	ALLOCATION_CORRECT_CTA_CLICKED: "allocation_correct_cta_clicked",
	ALLOCATION_CORRECT_STARTED: "allocation_correct_started",
	ALLOCATION_CORRECT_COMPLETED: "allocation_correct_completed",
	INCOME_EVENT_UPDATED: "income_event_updated",
	MOVEMENT_DELETED: "movement_deleted",

	// Coach
	COACH_RECOMMENDATION_INTERACTED: "coach_recommendation_interacted",
	CRISIS_RECOMMENDATION_RESOLVED: "crisis_recommendation_resolved",

	// Engagement
	NOTIFICATION_CLICKED: "notification_clicked",
	NOTIFICATION_DISMISSED: "notification_dismissed",
	WEEKLY_SUMMARY_VIEWED: "weekly_summary_viewed",
	MONTHLY_SUMMARY_VIEWED: "monthly_summary_viewed",
	FINANCIAL_INSIGHT_VIEWED: "financial_insight_viewed",

	// Feedback
	FEEDBACK_SUBMITTED: "feedback_submitted",
	FEEDBACK_ENTRY_CLICKED: "feedback_entry_clicked",

	// Billing / Plus
	PLUS_PAYWALL_VIEWED: "plus_paywall_viewed",
	PLUS_CHECKOUT_STARTED: "plus_checkout_started",
	PLUS_CHECKOUT_COMPLETED: "plus_checkout_completed",
	PLUS_PORTAL_OPENED: "plus_portal_opened",

	// Espacios compartidos
	ESPACIOS_HUB_VIEWED: "espacios_hub_viewed",
	ESPACIOS_PREMIUM_PAYWALL_VIEWED: "espacios_premium_paywall_viewed",
	SPACE_CREATED: "space_created",
	SPACE_INVITE_ACCEPTED: "space_invite_accepted",
	SPACE_DASHBOARD_VIEWED: "space_dashboard_viewed",
	SPACE_EXPENSE_REGISTERED: "space_expense_registered",
	SPACE_CONTRIBUTION_COMPLETED: "space_contribution_completed",
	SPACE_PROPOSAL_CREATED: "space_proposal_created",
	SPACE_PROPOSAL_CONFIRMED: "space_proposal_confirmed",
	SPACE_PROPOSAL_REJECTED: "space_proposal_rejected",
	SPACE_ENTERED_READONLY: "space_entered_readonly",
	SPACE_REACTIVATED: "space_reactivated",
} as const;

export type AnalyticsEvent = (typeof AnalyticsEvents)[keyof typeof AnalyticsEvents];

// ─── Mapa tipado evento → payload ──────────────────────────────────────────
//
// `track()` usa este mapa para que las props correctas se exijan en cada
// call site. Es la única fuente de verdad entre el nombre y la shape.
//
// `{}` en un evento con propiedades vacías se valida como `Record<string, never>`
// — un objeto sin keys permitidas. Útil para forzar que no se envíe metadata
// accidental.

export type AnalyticsEventPayloads = {
	[AnalyticsEvents.USER_SIGNED_UP]: UserSignedUpProperties;
	[AnalyticsEvents.USER_LOGGED_IN]: UserLoggedInProperties;
	[AnalyticsEvents.USER_LOGGED_OUT]: Record<string, never>;
	[AnalyticsEvents.PASSKEY_CREATED]: PasskeyCreatedProperties;

	[AnalyticsEvents.ONBOARDING_STARTED]: Record<string, never>;
	[AnalyticsEvents.ONBOARDING_STEP_VIEWED]: OnboardingStepProperties;
	[AnalyticsEvents.ONBOARDING_STEP_COMPLETED]: OnboardingStepProperties;
	[AnalyticsEvents.ONBOARDING_COMPLETED]: OnboardingCompletedProperties;
	[AnalyticsEvents.ONBOARDING_ABANDONED]: OnboardingAbandonedProperties;

	[AnalyticsEvents.DASHBOARD_VIEWED]: DashboardViewedProperties;
	[AnalyticsEvents.ENVELOPE_OPENED]: EnvelopeOpenedProperties;
	[AnalyticsEvents.FINANCIAL_CYCLE_STARTED]: FinancialCycleProperties;
	[AnalyticsEvents.FINANCIAL_CYCLE_CLOSED]: FinancialCycleProperties;

	[AnalyticsEvents.INCOME_REGISTERED]: IncomeRegisteredProperties;
	[AnalyticsEvents.EXTRA_INCOME_REGISTERED]: ExtraIncomeRegisteredProperties;

	[AnalyticsEvents.EXPENSE_REGISTERED]: ExpenseRegisteredProperties;

	[AnalyticsEvents.SAVINGS_GOAL_CREATED]: SavingsGoalCreatedProperties;
	[AnalyticsEvents.ADDITIONAL_SAVINGS_ADDED]: AdditionalSavingsAddedProperties;
	[AnalyticsEvents.SAVINGS_CONTRIBUTION_COMPLETED]: SavingsContributionCompletedProperties;

	[AnalyticsEvents.FIXED_COMMITMENT_CREATED]: FixedCommitmentCreatedProperties;

	[AnalyticsEvents.ALLOCATION_MODIFIED]: AllocationModifiedProperties;

	[AnalyticsEvents.ALLOCATION_REVIEW_SURFACED]: AllocationReviewSurfacedProperties;
	[AnalyticsEvents.ALLOCATION_CORRECT_CTA_CLICKED]: AllocationCorrectCtaClickedProperties;
	[AnalyticsEvents.ALLOCATION_CORRECT_STARTED]: AllocationCorrectStartedProperties;
	[AnalyticsEvents.ALLOCATION_CORRECT_COMPLETED]: AllocationCorrectCompletedProperties;
	[AnalyticsEvents.INCOME_EVENT_UPDATED]: IncomeEventUpdatedProperties;
	[AnalyticsEvents.MOVEMENT_DELETED]: MovementDeletedProperties;

	[AnalyticsEvents.COACH_RECOMMENDATION_INTERACTED]: CoachRecommendationInteractedProperties;
	[AnalyticsEvents.CRISIS_RECOMMENDATION_RESOLVED]: CrisisRecommendationResolvedProperties;

	[AnalyticsEvents.NOTIFICATION_CLICKED]: NotificationInteractedProperties;
	[AnalyticsEvents.NOTIFICATION_DISMISSED]: NotificationInteractedProperties;
	[AnalyticsEvents.WEEKLY_SUMMARY_VIEWED]: SummaryViewedProperties;
	[AnalyticsEvents.MONTHLY_SUMMARY_VIEWED]: SummaryViewedProperties;
	[AnalyticsEvents.FINANCIAL_INSIGHT_VIEWED]: FinancialInsightViewedProperties;

	[AnalyticsEvents.FEEDBACK_SUBMITTED]: FeedbackSubmittedProperties;
	[AnalyticsEvents.FEEDBACK_ENTRY_CLICKED]: FeedbackEntryClickedProperties;

	[AnalyticsEvents.PLUS_PAYWALL_VIEWED]: PlusPaywallViewedProperties;
	[AnalyticsEvents.PLUS_CHECKOUT_STARTED]: PlusCheckoutStartedProperties;
	[AnalyticsEvents.PLUS_CHECKOUT_COMPLETED]: PlusCheckoutCompletedProperties;
	[AnalyticsEvents.PLUS_PORTAL_OPENED]: PlusPortalOpenedProperties;

	[AnalyticsEvents.ESPACIOS_HUB_VIEWED]: EspaciosHubViewedProperties;
	[AnalyticsEvents.ESPACIOS_PREMIUM_PAYWALL_VIEWED]: EspaciosPremiumPaywallViewedProperties;
	[AnalyticsEvents.SPACE_CREATED]: SpaceCreatedProperties;
	[AnalyticsEvents.SPACE_INVITE_ACCEPTED]: SpaceInviteAcceptedProperties;
	[AnalyticsEvents.SPACE_DASHBOARD_VIEWED]: SpaceDashboardViewedProperties;
	[AnalyticsEvents.SPACE_EXPENSE_REGISTERED]: SpaceExpenseRegisteredProperties;
	[AnalyticsEvents.SPACE_CONTRIBUTION_COMPLETED]: SpaceContributionCompletedProperties;
	[AnalyticsEvents.SPACE_PROPOSAL_CREATED]: SpaceProposalEventProperties;
	[AnalyticsEvents.SPACE_PROPOSAL_CONFIRMED]: SpaceProposalEventProperties;
	[AnalyticsEvents.SPACE_PROPOSAL_REJECTED]: SpaceProposalEventProperties;
	[AnalyticsEvents.SPACE_ENTERED_READONLY]: SpaceLifecycleProperties;
	[AnalyticsEvents.SPACE_REACTIVATED]: SpaceLifecycleProperties;
};

// Helper de inferencia: dado un evento, devuelve su payload.
export type PayloadFor<E extends AnalyticsEvent> = AnalyticsEventPayloads[E];
