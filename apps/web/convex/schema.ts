import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import {
	accentPresetValidator,
	appearanceThemeValidator,
	appIconVariantValidator,
} from "./lib/appearanceValidators";

/**
 * App-level schema.
 *
 * Only your own tables live here. Better Auth tables (`user`, `session`,
 * `account`, `passkey`, `verification`) are owned by the local `betterAuth`
 * component and are inferred into the generated `DataModel` automatically —
 * do not re-export them here.
 *
 * The `userId` field on your tables is a string that matches the
 * Better Auth user id. See `convex/profiles.ts` for the recommended way
 * to load a user + profile pair.
 */

export const appTables = {
	profiles: defineTable({
		userId: v.string(),
		name: v.string(),
		country: v.string(),
		currencyCode: v.string(), // e.g., "PEN"
		currencySymbol: v.string(), // e.g., "S/"

		// v2.5: how the user organizes their income cycle
		incomeModel: v.union(v.literal("fixed"), v.literal("variable"), v.literal("mixed")),
		cycleDurationDays: v.optional(v.number()), // 15 or 30 for variable income
		mixedFixedAmount: v.optional(v.number()), // centimos, estimado de la parte fija en modelo mixed
		variableIncomeSources: v.optional(v.array(v.string())), // labels libres de fuentes de ingreso variable

		// Cadencia con la que el usuario recibe su dinero.
		// v2.5: extendemos el union a 4 valores (semanal y variable son nuevos).
		// Slice B del onboarding endurezca a required cuando P0-2 cierre.
		payFrequency: v.optional(
			v.union(
				v.literal("monthly"),
				v.literal("biweekly"),
				v.literal("weekly"),
				v.literal("variable"),
			),
		),
		paydays: v.optional(v.array(v.number())), // e.g., [15, 30] para tus quincenas

		// Distribución del pre-compromiso (Madres de Contabilidad Mental)
		allocationNeeds: v.number(), // Default: 50
		allocationWants: v.number(), // Default: 30
		allocationSavings: v.number(), // Default: 20

		extraordinaryRules: v.optional(
			v.object({
				cts: v.union(
					v.literal("all_to_emergency_fund"),
					v.literal("profile_default"),
					v.literal("all_to_savings"),
					v.literal("ask_each_time"),
				),
				gratifications: v.union(
					v.literal("all_to_emergency_fund"),
					v.literal("profile_default"),
					v.literal("all_to_savings"),
					v.literal("ask_each_time"),
				),
				corporate_bonus: v.union(
					v.literal("all_to_emergency_fund"),
					v.literal("profile_default"),
					v.literal("all_to_savings"),
					v.literal("ask_each_time"),
				),
				profit_sharing: v.union(
					v.literal("all_to_emergency_fund"),
					v.literal("profile_default"),
					v.literal("all_to_savings"),
					v.literal("ask_each_time"),
				),
				custom: v.union(
					v.literal("all_to_emergency_fund"),
					v.literal("profile_default"),
					v.literal("all_to_savings"),
					v.literal("ask_each_time"),
				),
			}),
		),
		extraordinaryRulesAutoApply: v.optional(
			v.object({
				cts: v.optional(v.boolean()),
				gratifications: v.optional(v.boolean()),
				corporate_bonus: v.optional(v.boolean()),
				profit_sharing: v.optional(v.boolean()),
				custom: v.optional(v.boolean()),
			}),
		),

		// Estado del SaaS (Sincronizado vía Webhooks de Polar.sh)
		onboardingComplete: v.boolean(),
		plan: v.union(v.literal("free"), v.literal("premium")),
		polarCustomerId: v.optional(v.string()),
		polarSubscriptionId: v.optional(v.string()),
		coachCrisisSnoozedUntil: v.optional(v.number()),
		// Legacy (I3): rescate ya no usa upsell; campos opcionales sin escritura nueva.
		coachRescueUpsellAt: v.optional(v.number()),
		coachRescueUpsellDismissedAt: v.optional(v.number()),
		appearanceTheme: v.optional(appearanceThemeValidator),
		accentPreset: v.optional(accentPresetValidator),
		appIconVariant: v.optional(appIconVariantValidator),
		// Bloque 9 — preferencias de notificaciones (undefined = defaults en lectura).
		dailySummaryEnabled: v.optional(v.boolean()),
		cycleAlertsEnabled: v.optional(v.boolean()),
		createdAt: v.number(),
		accountStatus: v.optional(
			v.union(v.literal("active"), v.literal("suspended"), v.literal("under_review")),
		),
		// I8 — candidato a revisión de contenido (no barrer todos los perfiles).
		needsContentReview: v.optional(v.boolean()),
	})
		.index("by_userId", ["userId"])
		.index("by_polarCustomerId", ["polarCustomerId"])
		.index("by_polarSubscriptionId", ["polarSubscriptionId"])
		.index("by_needsContentReview", ["needsContentReview"]),

	// Ciclos de Flujo de Caja reales (Payday-to-Payday)
	financialCycles: defineTable({
		profileId: v.id("profiles"),
		startDate: v.number(),
		endDate: v.number(), // Próxima fecha estimada de recarga
		status: v.union(v.literal("active"), v.literal("closed")),
		// v2.5: unified total, snapshot materializado de los incomeEvents del ciclo
		totalIncomeReceived: v.number(),
		// P1-10: boost de cobertura aplicado desde Ahorro del ciclo (coach crisis).
		coverageBoost: v.optional(
			v.object({
				needs: v.number(),
				wants: v.number(),
			}),
		),
		// Allocation ledger: money not yet assigned to envelopes/reservations/savings.
		unallocatedCents: v.optional(v.number()),
		// Legacy cycles without incomeAllocationLines need user review (not silent invent).
		needsReview: v.optional(v.boolean()),
		closeSurplusMovedAt: v.optional(v.number()),
		carriedOverFromCycleId: v.optional(v.id("financialCycles")),
		carriedOverToCycleId: v.optional(v.id("financialCycles")),
		carriedOverExtraordinaryCents: v.optional(v.number()),
		// Onboarding: saldo de hoy hasta el próximo cobro. No es un ingreso y no cuenta en la racha.
		isOpeningCycle: v.optional(v.boolean()),
	}).index("by_profile_status", ["profileId", "status"]),

	// SOBRES CON SALDO VIVO: Resuelve la lentitud del dashboard O(1)
	envelopes: defineTable({
		profileId: v.id("profiles"),
		cycleId: v.id("financialCycles"),
		type: v.union(v.literal("needs"), v.literal("wants"), v.literal("savings")),
		allocatedAmount: v.number(),
		remainingAmount: v.number(), // Saldo vivo mutable modificado por gastos en tiempo real
		carriedOverCents: v.optional(v.number()),
		frozenUntil: v.optional(v.number()),
	})
		.index("by_cycle_type", ["cycleId", "type"])
		.index("by_profile_type", ["profileId", "type"]),

	// SUB-SOBRES DE AHORRO: Exclusivos para metas (Evita la microgestión en Necesidades/Gustos)
	subEnvelopes: defineTable({
		profileId: v.id("profiles"),
		parentEnvelopeType: v.literal("savings"), // Restringido estrictamente por diseño conductual
		label: v.string(), // e.g., "Fondo de Emergencia", "Viaje a Cusco"
		emoji: v.string(),
		currentAmount: v.number(),
		targetAmount: v.optional(v.number()),
		isSystemDefault: v.boolean(), // true para el Fondo de Emergencia mandatorio del sistema
	}).index("by_profile", ["profileId"]),

	// COMPROMISOS FIJOS: Gastos recurrentes del calendario del usuario (alquiler día 5,
	// Netflix día 18, etc.). NO se descuentan del ingreso antes del 50/30/20; el motor
	// de cobertura P1-1 evalúa si los sobres ya asignados los financian. El mecanismo
	// para reservar dinero antes de repartir es `heldCents` en el `incomeEvent`.
	// v2.5: el modelo es dueDay puro (día del mes, Lima). El campo "frequency"
	// viejo (first_payday / second_payday / every_payday) se eliminó porque
	// el frame del onboarding muestra "Cada día N", no el modelo de quincenas.
	fixedCommitments: defineTable({
		profileId: v.id("profiles"),
		name: v.string(),
		amount: v.number(),
		envelope: v.union(v.literal("needs"), v.literal("wants")),
		// v2.5: día del mes (Lima) en que se descuenta el compromiso. 1-31.
		dueDay: v.number(),
		// P1-1: cobertura persistida cuando los incomeEvents del ciclo lo financian.
		coveredAt: v.optional(v.number()),
		coveredBy: v.optional(v.array(v.id("incomeEvents"))),
		// P1-10: pospuesto solo para el ciclo activo (coach crisis).
		postponedForCycleId: v.optional(v.id("financialCycles")),
		// Concrete next payment due date (Lima midnight). Recurring rule stays in dueDay.
		nextDueAt: v.optional(v.number()),
		// Seguimiento de pago confirmado por el usuario (por ciclo). No mueve sobres.
		paidAt: v.optional(v.number()),
		paidForCycleId: v.optional(v.id("financialCycles")),
	})
		.index("by_profileId", ["profileId"])
		.index("by_profile_dueDay", ["profileId", "dueDay"]),

	// HISTORIAL DE GASTOS: Vinculado directamente a su ciclo dinámico de flujo
	expenses: defineTable({
		profileId: v.id("profiles"),
		cycleId: v.id("financialCycles"),
		envelopeId: v.id("envelopes"),
		subEnvelopeId: v.optional(v.id("subEnvelopes")), // Solo si afecta un fondo de ahorro
		amount: v.number(),
		description: v.string(),
		timestamp: v.number(),
		// P3-5: trazabilidad mínima de edición; _creationTime cubre creación.
		updatedAt: v.optional(v.number()),
	})
		.index("by_cycle_envelope_time", ["cycleId", "envelopeId", "timestamp"])
		.index("by_cycle_time", ["cycleId", "timestamp"])
		.index("by_profile_time", ["profileId", "timestamp"]),

	// COACH DE IA PROACTIVO: Interacciones interactivas de un click (Opción 2)
	coachInteractions: defineTable({
		profileId: v.id("profiles"),
		cycleId: v.id("financialCycles"),
		triggerEvent: v.string(), // e.g., "WANTS_OVERFLOW_60", "STREAK_AT_RISK"
		initialNudge: v.string(), // Texto que expone el problema en el Dashboard
		options: v.array(
			v.object({
				id: v.string(), // e.g., "apply_rescue", "freeze_wants", "ignore"
				label: v.string(), // e.g., "Activar Modo Rescate"
			}),
		),
		selectedOptionId: v.optional(v.string()), // Almacena la decisión del usuario
		rescueSuggestion: v.optional(
			v.object({
				transfer: v.number(),
				projectedDeficit: v.number(),
			}),
		),
		status: v.union(v.literal("pending"), v.literal("resolved"), v.literal("applied")),
		createdAt: v.number(),
	}).index("by_profile_status", ["profileId", "status"]),

	// SISTEMA DE RACHAS: Soporta buffers para evitar el efecto "What the Hell"
	streaks: defineTable({
		profileId: v.id("profiles"),
		currentStreak: v.number(),
		longestStreak: v.number(),
		lastEvaluatedCycleId: v.optional(v.id("financialCycles")),
	}).index("by_profileId", ["profileId"]),

	// HISTORIAL DE CUMPLIMIENTO DE CICLOS: Desglosa si entró en zona de advertencia
	cycleHistory: defineTable({
		profileId: v.id("profiles"),
		cycleId: v.id("financialCycles"),
		status: v.union(v.literal("compliant"), v.literal("warning"), v.literal("failed")), // "warning" actua como zona de amortiguación
		evaluatedAt: v.number(),
		wantsWithinBudget: v.boolean(),
		allCommitmentsCovered: v.boolean(),
		// Plus v1: whether the user had premium when this cycle closed.
		closedAtPremium: v.optional(v.boolean()),
	})
		.index("by_profile_cycle", ["profileId", "cycleId"])
		.index("by_profileId", ["profileId"]),

	// v2.5: unified income event log. Replaces the implicit "salary vs cachuelo"
	// distinction that lived in financialCycles.baseIncomeReceived +
	// adHocIncomes in v2.0.
	incomeEvents: defineTable({
		profileId: v.id("profiles"),
		cycleId: v.id("financialCycles"),
		amount: v.number(), // integer cents, > 0
		source: v.union(
			v.literal("payroll"),
			v.literal("freelance"),
			v.literal("business"),
			v.literal("gift"),
			v.literal("refund"),
			v.literal("investment"),
			v.literal("other"),
		),
		description: v.string(), // always required
		occurredAt: v.number(), // timestamp, can be retroactive
		distributionApplied: v.object({
			needs: v.number(),
			wants: v.number(),
			savings: v.number(),
		}),
		incomeKind: v.optional(v.union(v.literal("habitual"), v.literal("extraordinary"))),
		extraordinaryType: v.optional(
			v.union(
				v.literal("gratification_july"),
				v.literal("gratification_december"),
				v.literal("cts"),
				v.literal("corporate_bonus"),
				v.literal("profit_sharing"),
				v.literal("custom"),
			),
		),
		extraordinaryLabel: v.optional(v.string()),
		distributionPolicy: v.optional(
			v.union(v.literal("profile_default"), v.literal("all_to_savings")),
		),
		appliedByAutoRule: v.optional(v.boolean()),
		// P3-4: optional hold before 50/30/20. Integer cents, 0..amount.
		// Historical: sum of reservation cents at create/update time (display).
		// Coverage and spendable use commitmentReservations, not this field.
		heldCents: v.optional(v.number()),
		// P3-5: trazabilidad mínima de edición; _creationTime cubre creación.
		updatedAt: v.optional(v.number()),
	})
		.index("by_cycle", ["cycleId"])
		.index("by_profile_time", ["profileId", "occurredAt"]),

	surplusContributions: defineTable({
		profileId: v.id("profiles"),
		cycleId: v.id("financialCycles"),
		fromEnvelope: v.union(v.literal("needs"), v.literal("wants"), v.literal("extraordinary")),
		amount: v.number(),
		subEnvelopeId: v.id("subEnvelopes"),
		createdAt: v.number(),
		// Confirmed contribution semantics. Missing on legacy rows → treat as "additional".
		contributionKind: v.optional(v.union(v.literal("objective"), v.literal("additional"))),
	}).index("by_cycle", ["cycleId"]),

	// Explicit money reserved for a fixed commitment before payment.
	commitmentReservations: defineTable({
		profileId: v.id("profiles"),
		cycleId: v.id("financialCycles"),
		commitmentId: v.id("fixedCommitments"),
		incomeEventId: v.optional(v.id("incomeEvents")),
		reservedCents: v.number(),
		status: v.union(
			v.literal("active"),
			v.literal("partially_consumed"),
			v.literal("consumed"),
			v.literal("released"),
		),
		consumedCents: v.number(),
		releasedCents: v.number(),
		createdAt: v.number(),
		updatedAt: v.optional(v.number()),
	})
		.index("by_cycle", ["cycleId"])
		.index("by_commitment_cycle", ["commitmentId", "cycleId"])
		.index("by_profile_status", ["profileId", "status"]),

	// Immutable distribution facts for each income event (one row per destination slice).
	incomeAllocationLines: defineTable({
		profileId: v.id("profiles"),
		cycleId: v.id("financialCycles"),
		incomeEventId: v.id("incomeEvents"),
		destination: v.union(
			v.literal("envelope_needs"),
			v.literal("envelope_wants"),
			v.literal("envelope_savings"),
			v.literal("commitment_reservation"),
			v.literal("savings_contribution"),
			v.literal("unallocated"),
		),
		amountCents: v.number(),
		commitmentId: v.optional(v.id("fixedCommitments")),
		reservationId: v.optional(v.id("commitmentReservations")),
		subEnvelopeId: v.optional(v.id("subEnvelopes")),
		contributionKind: v.optional(v.union(v.literal("objective"), v.literal("additional"))),
		createdAt: v.number(),
	})
		.index("by_income_event", ["incomeEventId"])
		.index("by_cycle", ["cycleId"]),

	// Auditable internal money moves (not income, not expense).
	internalTransfers: defineTable({
		profileId: v.id("profiles"),
		cycleId: v.id("financialCycles"),
		kind: v.union(
			v.literal("cycle_correction"),
			v.literal("reservation_release"),
			v.literal("reservation_from_envelope"),
			v.literal("envelope_rebalance"),
			v.literal("unallocated_to_envelope"),
			v.literal("unallocated_to_reservation"),
			v.literal("unallocated_to_savings"),
			v.literal("savings_to_unallocated"),
			// Bank vs Quipu cash gap — not income, expense, or savings.
			v.literal("liquidity_reconciliation"),
			// Write-down of inferred Fondo that never existed as confirmed cash.
			v.literal("inferred_savings_annulment"),
			v.literal("personal_to_space_contribution"),
		),
		amountCents: v.number(),
		from: v.string(),
		to: v.string(),
		note: v.optional(v.string()),
		spaceId: v.optional(v.id("financialSpaces")),
		spaceContributionId: v.optional(v.id("spaceContributions")),
		createdAt: v.number(),
	}).index("by_cycle", ["cycleId"]),

	// ─── Modo Pareja (Espacios Premium v1) ───────────────────────────────────

	financialSpaces: defineTable({
		name: v.string(),
		createdByProfileId: v.id("profiles"),
		status: v.union(v.literal("active"), v.literal("closed"), v.literal("readonly")),
		currencyCode: v.string(),
		currencySymbol: v.string(),
		allocationNeeds: v.number(),
		allocationWants: v.number(),
		allocationSavings: v.number(),
		cycleDurationDays: v.number(),
		cycleAnchorAt: v.number(),
		premiumExpiredAt: v.optional(v.number()),
		closedAt: v.optional(v.number()),
		createdAt: v.number(),
	}).index("by_creator", ["createdByProfileId"]),

	spaceMembers: defineTable({
		spaceId: v.id("financialSpaces"),
		profileId: v.id("profiles"),
		role: v.union(v.literal("owner"), v.literal("member")),
		status: v.union(v.literal("active"), v.literal("left")),
		expectedContributionCents: v.number(),
		joinedAt: v.number(),
		leftAt: v.optional(v.number()),
	})
		.index("by_profile", ["profileId"])
		.index("by_space_profile", ["spaceId", "profileId"])
		.index("by_space_status", ["spaceId", "status"]),

	spaceInvitations: defineTable({
		spaceId: v.id("financialSpaces"),
		tokenHash: v.string(),
		invitedEmail: v.optional(v.string()),
		status: v.union(
			v.literal("pending"),
			v.literal("accepted"),
			v.literal("revoked"),
			v.literal("expired"),
		),
		expiresAt: v.number(),
		createdByProfileId: v.id("profiles"),
		acceptedByProfileId: v.optional(v.id("profiles")),
		createdAt: v.number(),
	})
		.index("by_tokenHash", ["tokenHash"])
		.index("by_space_status", ["spaceId", "status"]),

	spaceCycles: defineTable({
		spaceId: v.id("financialSpaces"),
		startDate: v.number(),
		endDate: v.number(),
		status: v.union(v.literal("active"), v.literal("closed")),
		totalContributionsReceived: v.number(),
		unallocatedCents: v.optional(v.number()),
		memberParticipationSnapshot: v.optional(v.any()),
		allocationSnapshot: v.optional(v.any()),
		closedAt: v.optional(v.number()),
	}).index("by_space_status", ["spaceId", "status"]),

	spaceEnvelopes: defineTable({
		spaceId: v.id("financialSpaces"),
		cycleId: v.id("spaceCycles"),
		type: v.union(v.literal("needs"), v.literal("wants"), v.literal("savings")),
		allocatedAmount: v.number(),
		remainingAmount: v.number(),
	})
		.index("by_cycle_type", ["cycleId", "type"])
		.index("by_space", ["spaceId"]),

	spaceGoals: defineTable({
		spaceId: v.id("financialSpaces"),
		label: v.string(),
		emoji: v.string(),
		currentAmount: v.number(),
		targetAmount: v.optional(v.number()),
		createdAt: v.number(),
	}).index("by_space", ["spaceId"]),

	spaceContributions: defineTable({
		spaceId: v.id("financialSpaces"),
		cycleId: v.id("spaceCycles"),
		fromProfileId: v.id("profiles"),
		fromPersonalEnvelopeId: v.optional(v.id("envelopes")),
		kind: v.union(v.literal("explicit_transfer"), v.literal("expense_paid_personally")),
		amountCents: v.number(),
		envelopeType: v.optional(v.union(v.literal("needs"), v.literal("wants"), v.literal("savings"))),
		linkedSpaceExpenseId: v.optional(v.id("spaceExpenses")),
		linkedPersonalTransferId: v.optional(v.id("internalTransfers")),
		createdAt: v.number(),
	})
		.index("by_space_cycle", ["spaceId", "cycleId"])
		.index("by_profile", ["fromProfileId"])
		.index("by_cycle", ["cycleId"]),

	spaceExpenses: defineTable({
		spaceId: v.id("financialSpaces"),
		cycleId: v.id("spaceCycles"),
		paidByProfileId: v.id("profiles"),
		envelopeType: v.union(v.literal("needs"), v.literal("wants"), v.literal("savings")),
		fundingSource: v.union(v.literal("space_budget"), v.literal("personal_pocket")),
		amount: v.number(),
		description: v.string(),
		timestamp: v.number(),
	})
		.index("by_space_cycle_time", ["spaceId", "cycleId", "timestamp"])
		.index("by_paid_by", ["paidByProfileId"]),

	spaceCommitments: defineTable({
		spaceId: v.id("financialSpaces"),
		name: v.string(),
		amount: v.number(),
		envelope: v.union(v.literal("needs"), v.literal("wants")),
		dueDay: v.number(),
		createdAt: v.number(),
	}).index("by_space", ["spaceId"]),

	spaceChangeProposals: defineTable({
		spaceId: v.id("financialSpaces"),
		kind: v.union(
			v.literal("allocation"),
			v.literal("cycle_duration"),
			v.literal("expected_contribution"),
		),
		payload: v.any(),
		effectiveOn: v.union(v.literal("current_cycle"), v.literal("next_cycle")),
		status: v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected")),
		proposedByProfileId: v.id("profiles"),
		respondedByProfileId: v.optional(v.id("profiles")),
		createdAt: v.number(),
		respondedAt: v.optional(v.number()),
	})
		.index("by_space_status", ["spaceId", "status"])
		.index("by_space", ["spaceId"]),

	emailSendLog: defineTable({
		email: v.string(),
		kind: v.union(v.literal("verification"), v.literal("password_reset")),
		sentAt: v.number(),
	}).index("by_email_kind", ["email", "kind"]),

	accountReviewFlags: defineTable({
		profileId: v.id("profiles"),
		reason: v.union(
			v.literal("content"),
			v.literal("email"),
			v.literal("manual"),
			v.literal("volume"),
		),
		severity: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
		snippet: v.optional(v.string()),
		status: v.union(v.literal("open"), v.literal("dismissed"), v.literal("actioned")),
		createdAt: v.number(),
	})
		.index("by_status", ["status", "createdAt"])
		.index("by_profileId", ["profileId"]),

	feedbackSubmissions: defineTable({
		userId: v.string(),
		profileId: v.id("profiles"),
		category: v.union(v.literal("problem"), v.literal("improvement"), v.literal("question")),
		message: v.string(),
		userEmail: v.optional(v.string()),
		userName: v.string(),
		plan: v.union(v.literal("free"), v.literal("premium")),
		pagePath: v.optional(v.string()),
		userAgent: v.optional(v.string()),
		createdAt: v.number(),
		teamEmailStatus: v.union(v.literal("sent"), v.literal("failed"), v.literal("skipped")),
		userEmailStatus: v.union(v.literal("sent"), v.literal("failed"), v.literal("skipped")),
	})
		.index("by_userId", ["userId"])
		.index("by_profileId_createdAt", ["profileId", "createdAt"]),
};

const schema = defineSchema(appTables);

export default schema;
