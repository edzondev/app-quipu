import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

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

    // Configuración del motor de Flujo de Caja
    workerType: v.union(v.literal("dependent"), v.literal("independent")),
    payFrequency: v.union(v.literal("monthly"), v.literal("biweekly")),
    paydays: v.array(v.number()), // e.g., [15, 30] para tus quincenas

    // Distribución del pre-compromiso (Madres de Contabilidad Mental)
    allocationNeeds: v.number(), // Default: 50
    allocationWants: v.number(), // Default: 30
    allocationSavings: v.number(), // Default: 20

    // Estado del SaaS (Sincronizado vía Webhooks de Polar.sh)
    onboardingComplete: v.boolean(),
    plan: v.union(v.literal("free"), v.literal("premium")),
    polarCustomerId: v.optional(v.string()),
    polarSubscriptionId: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_polarCustomerId", ["polarCustomerId"])
    .index("by_polarSubscriptionId", ["polarSubscriptionId"]),

  // Ciclos de Flujo de Caja reales (Payday-to-Payday)
  financialCycles: defineTable({
    profileId: v.id("profiles"),
    startDate: v.number(),
    endDate: v.number(), // Próxima fecha estimada de recarga
    status: v.union(v.literal("active"), v.literal("closed")),
    baseIncomeReceived: v.number(),
    extraordinaryIncomeReceived: v.number(), // Gratificaciones / CTS ingresan limpio aquí
    totalPeriodIncome: v.number(),
  }).index("by_profile_status", ["profileId", "status"]),

  // SOBRES CON SALDO VIVO: Resuelve la lentitud del dashboard O(1)
  envelopes: defineTable({
    profileId: v.id("profiles"),
    cycleId: v.id("financialCycles"),
    type: v.union(v.literal("needs"), v.literal("wants"), v.literal("savings")),
    allocatedAmount: v.number(),
    remainingAmount: v.number(), // Saldo vivo mutable modificado por gastos en tiempo real
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

  // COMPROMISOS FIJOS: Descontados atómicamente antes de calcular el 50/30/20
  fixedCommitments: defineTable({
    profileId: v.id("profiles"),
    name: v.string(),
    amount: v.number(),
    frequency: v.union(
      v.literal("monthly"),
      v.literal("first_payday"),
      v.literal("second_payday"),
      v.literal("every_payday"),
    ),
    envelope: v.union(v.literal("needs"), v.literal("wants")),
  }).index("by_profileId", ["profileId"]),

  // HISTORIAL DE GASTOS: Vinculado directamente a su ciclo dinámico de flujo
  expenses: defineTable({
    profileId: v.id("profiles"),
    cycleId: v.id("financialCycles"),
    envelopeId: v.id("envelopes"),
    subEnvelopeId: v.optional(v.id("subEnvelopes")), // Solo si afecta un fondo de ahorro
    amount: v.number(),
    description: v.string(),
    timestamp: v.number(),
  })
    .index("by_cycle_envelope_time", ["cycleId", "envelopeId", "timestamp"])
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
    status: v.union(v.literal("pending"), v.literal("resolved")),
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
    status: v.union(
      v.literal("compliant"),
      v.literal("warning"),
      v.literal("failed"),
    ), // "warning" actua como zona de amortiguación
    evaluatedAt: v.number(),
  }).index("by_profile_cycle", ["profileId", "cycleId"]),

  adHocIncomes: defineTable({
    profileId: v.id("profiles"),
    cycleId: v.id("financialCycles"),
    amount: v.number(), // céntimos
    description: v.string(),
    timestamp: v.number(),
    // Breakdown aplicado al registrar → permite revertir exacto aunque cambien las allocations.
    split: v.object({
      needs: v.number(),
      wants: v.number(),
      savings: v.number(),
    }),
  })
    .index("by_cycle", ["cycleId"])
    .index("by_profile", ["profileId"]),
};

const schema = defineSchema(appTables);

export default schema;
