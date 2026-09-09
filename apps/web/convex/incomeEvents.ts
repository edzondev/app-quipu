import { ConvexError, v } from "convex/values";
import type { DistributionPolicy } from "../shared/lib/allocations";
import { limaStartOfDay } from "../shared/lib/date";
import { validateAllocationPlan } from "../shared/lib/incomeAllocation";
import type { Id } from "./_generated/dataModel";
import { mutation } from "./_generated/server";
import { persistIncomeAllocation } from "./lib/applyIncomeAllocation";
import { CYCLE_DAYS, ENVELOPE_TYPES } from "./lib/budgetMath";
import { sumActiveReservedCents } from "./lib/commitmentReservation";
import {
  computeCycleDayMetrics,
  computeDisplayDailyCents,
} from "./lib/dashboardMath";
import { buildDefaultAllocationPlan } from "./lib/defaultAllocationPlan";
import { requireActiveAccount } from "./lib/entitlements";
import { canReverseDistributionApplied } from "./lib/envelopeGuards";
import { evaluateClosedCycle } from "./lib/evaluateClosedCycle";
import {
  clearCommitmentCoverageForProfile,
  evaluateCommitmentCoverageForCycle,
} from "./lib/evaluateCommitmentCoverage";
import {
  canonicalExtraordinaryDescription,
  type ExtraordinaryType,
  sourceForExtraordinaryType,
} from "./lib/extraordinaryIncome";
import { resolveExtraordinaryIncomePolicy } from "./lib/extraordinaryRules";
import type { AllocationPlan } from "./lib/incomeAllocation";
import { resolveCycleForEvent } from "./lib/incomeEventLogic";
import { markNeedsContentReviewIfSuspicious } from "./lib/markNeedsContentReview";
import { reverseIncomeAllocationLedger } from "./lib/reverseIncomeAllocationLedger";
import { computeSpendableSnapshot } from "./lib/spendableBalance";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const HORIZON_DAYS = 15; // v2.5 initial: fixed at 15 for variable income model.

const extraordinaryTypeValidator = v.union(
  v.literal("gratification_july"),
  v.literal("gratification_december"),
  v.literal("cts"),
  v.literal("corporate_bonus"),
  v.literal("profit_sharing"),
  v.literal("custom"),
);

const distributionPolicyValidator = v.union(
  v.literal("profile_default"),
  v.literal("all_to_savings"),
);

const allocationPlanValidator = v.object({
  reservations: v.array(
    v.object({
      commitmentId: v.id("fixedCommitments"),
      amountCents: v.number(),
    }),
  ),
  envelopes: v.object({
    needs: v.number(),
    wants: v.number(),
    savings: v.number(),
  }),
  savingsContributions: v.array(
    v.object({
      amountCents: v.number(),
      kind: v.union(v.literal("objective"), v.literal("additional")),
      subEnvelopeId: v.optional(v.id("subEnvelopes")),
    }),
  ),
  leaveUnallocatedCents: v.number(),
});

export const createIncomeEvent = mutation({
  args: {
    amount: v.number(),
    source: v.union(
      v.literal("payroll"),
      v.literal("freelance"),
      v.literal("business"),
      v.literal("gift"),
      v.literal("refund"),
      v.literal("investment"),
      v.literal("other"),
    ),
    description: v.string(),
    occurredAt: v.number(),
    incomeKind: v.optional(
      v.union(v.literal("habitual"), v.literal("extraordinary")),
    ),
    extraordinaryType: v.optional(extraordinaryTypeValidator),
    extraordinaryLabel: v.optional(v.string()),
    distributionPolicy: v.optional(distributionPolicyValidator),
    // Explicit distribution plan (required). Reservations + envelopes + contributions.
    allocation: allocationPlanValidator,
  },
  handler: async (ctx, args) => {
    const profile = await requireActiveAccount(ctx);
    if (!Number.isInteger(args.amount) || args.amount <= 0) {
      throw new ConvexError({
        code: "VALIDATION_ERROR",
        message: "El monto debe ser un entero de céntimos mayor a cero.",
        data: { field: "amount" },
      });
    }

    const explicitAllocation = args.allocation;
    const validated = validateAllocationPlan(args.amount, {
      reservations: explicitAllocation.reservations.map((row) => ({
        commitmentId: row.commitmentId,
        amountCents: row.amountCents,
      })),
      envelopes: explicitAllocation.envelopes,
      savingsContributions: explicitAllocation.savingsContributions.map(
        (row) => ({
          amountCents: row.amountCents,
          kind: row.kind,
          subEnvelopeId: row.subEnvelopeId,
        }),
      ),
      leaveUnallocatedCents: explicitAllocation.leaveUnallocatedCents,
    });
    if (!validated.ok) {
      throw new ConvexError({
        code: "VALIDATION_ERROR",
        message: validated.message,
        data: { field: "allocation" },
      });
    }

    const heldCents = explicitAllocation.reservations.reduce(
      (sum, row) => sum + row.amountCents,
      0,
    );
    const distributableCents =
      explicitAllocation.envelopes.needs +
      explicitAllocation.envelopes.wants +
      explicitAllocation.envelopes.savings;

    const incomeKind = args.incomeKind ?? "habitual";
    let resolvedSource = args.source;
    let resolvedDescription = "";
    let distributionPolicy: DistributionPolicy = "profile_default";
    let extraordinaryType: ExtraordinaryType | undefined;
    let extraordinaryLabel: string | undefined;
    let appliedByAutoRule = false;

    if (incomeKind === "extraordinary") {
      if (!args.extraordinaryType) {
        throw new ConvexError({
          code: "VALIDATION_ERROR",
          message: "Elige un tipo de ingreso extraordinario.",
          data: { field: "extraordinaryType" },
        });
      }
      extraordinaryType = args.extraordinaryType;
      if (extraordinaryType === "custom") {
        const label = args.extraordinaryLabel?.trim() ?? "";
        if (!label || label.length > 80) {
          throw new ConvexError({
            code: "VALIDATION_ERROR",
            message:
              "Describe el ingreso (1–80 caracteres) para «Otro extraordinario».",
            data: { field: "extraordinaryLabel" },
          });
        }
        extraordinaryLabel = label;
      } else if (args.extraordinaryLabel?.trim()) {
        throw new ConvexError({
          code: "VALIDATION_ERROR",
          message:
            "La etiqueta personalizada solo aplica a «Otro extraordinario».",
          data: { field: "extraordinaryLabel" },
        });
      }

      const resolved = resolveExtraordinaryIncomePolicy({
        isPremium: profile.plan === "premium",
        extraordinaryType,
        rules: profile.extraordinaryRules,
        autoApply: profile.extraordinaryRulesAutoApply,
        distributionPolicy: args.distributionPolicy,
      });
      if (!resolved.ok) {
        throw new ConvexError({
          code: "VALIDATION_ERROR",
          message: "Confirma a dónde va este ingreso extraordinario.",
          data: { field: "distributionPolicy" },
        });
      }
      distributionPolicy = resolved.distributionPolicy;
      appliedByAutoRule = resolved.appliedByAutoRule;
      resolvedSource = sourceForExtraordinaryType(extraordinaryType);
      resolvedDescription = canonicalExtraordinaryDescription(
        extraordinaryType,
        extraordinaryLabel,
      );
    } else {
      const description = args.description.trim();
      if (!description) {
        throw new ConvexError({
          code: "VALIDATION_ERROR",
          message: "La descripción es obligatoria.",
          data: { field: "description" },
        });
      }
      resolvedDescription = description;
      if (
        args.extraordinaryType !== undefined ||
        args.distributionPolicy !== undefined ||
        args.extraordinaryLabel !== undefined
      ) {
        throw new ConvexError({
          code: "VALIDATION_ERROR",
          message:
            "Los campos extraordinarios solo aplican a ingresos extraordinarios.",
        });
      }
    }

    const now = Date.now();
    const activeCycle = await ctx.db
      .query("financialCycles")
      .withIndex("by_profile_status", (q) =>
        q.eq("profileId", profile._id).eq("status", "active"),
      )
      .unique();

    const resolvedId = resolveCycleForEvent({
      activeCycle: activeCycle
        ? {
            _id: activeCycle._id,
            startDate: activeCycle.startDate,
            endDate: activeCycle.endDate,
          }
        : null,
      occurredAt: args.occurredAt,
      now,
    });

    let cycleId: Id<"financialCycles">;
    let isNewCycle = false;

    if (resolvedId && activeCycle && resolvedId === activeCycle._id) {
      cycleId = activeCycle._id;
    } else {
      if (activeCycle) {
        await evaluateClosedCycle(ctx, profile._id, activeCycle._id, now);
        await ctx.db.patch(activeCycle._id, { status: "closed" });
      }
      let cycleDays: number;
      if (profile.incomeModel === "variable") {
        cycleDays = profile.cycleDurationDays ?? HORIZON_DAYS;
      } else {
        const freq = profile.payFrequency;
        if (!freq) {
          throw new ConvexError({
            code: "VALIDATION_ERROR",
            message:
              "El perfil tiene incomeModel fijo/mixto pero no payFrequency configurado.",
          });
        }
        cycleDays = CYCLE_DAYS[freq];
      }
      // Ancla el ciclo a medianoche Lima del día del ingreso, no al instante
      // exacto: el conteo de días debe coincidir con el calendario del usuario.
      const startDate = limaStartOfDay(args.occurredAt);
      const endDate = startDate + cycleDays * MS_PER_DAY;
      cycleId = await ctx.db.insert("financialCycles", {
        profileId: profile._id,
        startDate,
        endDate,
        status: "active",
        totalIncomeReceived: 0,
      });
      isNewCycle = true;
      await clearCommitmentCoverageForProfile(ctx, profile._id);
    }

    const distribution = { ...explicitAllocation.envelopes };

    const eventId = await ctx.db.insert("incomeEvents", {
      profileId: profile._id,
      cycleId,
      amount: args.amount,
      source: resolvedSource,
      description: resolvedDescription,
      occurredAt: args.occurredAt,
      incomeKind,
      ...(extraordinaryType !== undefined && {
        extraordinaryType,
        extraordinaryLabel,
        distributionPolicy,
        ...(appliedByAutoRule && { appliedByAutoRule: true }),
      }),
      ...(heldCents > 0 && { heldCents }),
      distributionApplied: distribution,
    });

    const emergencyFund = (
      await ctx.db
        .query("subEnvelopes")
        .withIndex("by_profile", (q) => q.eq("profileId", profile._id))
        .collect()
    ).find((row) => row.isSystemDefault);

    const plan: AllocationPlan = {
      reservations: explicitAllocation.reservations.map((row) => ({
        commitmentId: row.commitmentId,
        amountCents: row.amountCents,
      })),
      envelopes: explicitAllocation.envelopes,
      savingsContributions: explicitAllocation.savingsContributions.map(
        (row) => ({
          amountCents: row.amountCents,
          kind: row.kind,
          subEnvelopeId: row.subEnvelopeId,
        }),
      ),
      leaveUnallocatedCents: explicitAllocation.leaveUnallocatedCents,
    };

    let addedUnallocated = 0;
    try {
      const persisted = await persistIncomeAllocation(ctx, {
        profileId: profile._id,
        cycleId,
        incomeEventId: eventId,
        amountCents: args.amount,
        plan,
        now,
        emergencyFundId: emergencyFund?._id,
      });
      addedUnallocated = persisted.unallocatedCents;
    } catch (error) {
      throw new ConvexError({
        code: "VALIDATION_ERROR",
        message:
          error instanceof Error
            ? error.message
            : "No se pudo aplicar la distribución.",
        data: { field: "allocation" },
      });
    }

    const envelopes = await ctx.db
      .query("envelopes")
      .withIndex("by_cycle_type", (q) => q.eq("cycleId", cycleId))
      .collect();

    if (envelopes.length === 0) {
      await Promise.all([
        ctx.db.insert("envelopes", {
          profileId: profile._id,
          cycleId,
          type: "needs",
          allocatedAmount: distribution.needs,
          remainingAmount: distribution.needs,
        }),
        ctx.db.insert("envelopes", {
          profileId: profile._id,
          cycleId,
          type: "wants",
          allocatedAmount: distribution.wants,
          remainingAmount: distribution.wants,
        }),
        ctx.db.insert("envelopes", {
          profileId: profile._id,
          cycleId,
          type: "savings",
          allocatedAmount: distribution.savings,
          remainingAmount: distribution.savings,
        }),
      ]);
    } else {
      await Promise.all(
        envelopes.map((env) =>
          ctx.db.patch(env._id, {
            allocatedAmount: env.allocatedAmount + distribution[env.type],
            remainingAmount: env.remainingAmount + distribution[env.type],
          }),
        ),
      );
    }

    const cycle = await ctx.db.get(cycleId);
    if (!cycle) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Ciclo no encontrado tras insert.",
      });
    }
    await ctx.db.patch(cycle._id, {
      totalIncomeReceived: cycle.totalIncomeReceived + args.amount,
      unallocatedCents: (cycle.unallocatedCents ?? 0) + addedUnallocated,
    });

    await evaluateCommitmentCoverageForCycle(ctx, profile._id, cycleId, now);

    const [updatedEnvelopes, updatedCycle, reservations] = await Promise.all([
      ctx.db
        .query("envelopes")
        .withIndex("by_cycle_type", (q) => q.eq("cycleId", cycleId))
        .collect(),
      ctx.db.get(cycleId),
      ctx.db
        .query("commitmentReservations")
        .withIndex("by_cycle", (q) => q.eq("cycleId", cycleId))
        .collect(),
    ]);
    if (!updatedCycle) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Ciclo no encontrado tras actualizar sobres.",
      });
    }

    const cycleMetrics = computeCycleDayMetrics(
      updatedCycle.startDate,
      updatedCycle.endDate,
      now,
    );
    const needsEnvelope = updatedEnvelopes.find((env) => env.type === "needs");
    const wantsEnvelope = updatedEnvelopes.find((env) => env.type === "wants");
    const savingsEnvelope = updatedEnvelopes.find(
      (env) => env.type === "savings",
    );
    const spendable = computeSpendableSnapshot({
      needsRemainingCents: needsEnvelope?.remainingAmount ?? 0,
      wantsRemainingCents: wantsEnvelope?.remainingAmount ?? 0,
      savingsRemainingCents: savingsEnvelope?.remainingAmount ?? 0,
      unallocatedCents: updatedCycle.unallocatedCents ?? 0,
      activeReservedCents: sumActiveReservedCents(reservations),
      daysRemaining: cycleMetrics.daysRemaining,
    });

    await markNeedsContentReviewIfSuspicious(ctx, profile._id, [
      resolvedDescription,
      extraordinaryLabel,
    ]);

    return {
      eventId,
      cycleId,
      isNewCycle,
      amount: args.amount,
      heldCents,
      distributableCents,
      unallocatedCents: updatedCycle.unallocatedCents ?? 0,
      reservedCents: spendable.reservedCents,
      spendableCents: spendable.spendableCents,
      source: resolvedSource,
      description: resolvedDescription,
      distributionApplied: distribution,
      envelopes: ENVELOPE_TYPES.map((type) => {
        const envelope = updatedEnvelopes.find((env) => env.type === type);
        return {
          type,
          remainingAmount: envelope?.remainingAmount ?? 0,
          allocatedAmount: envelope?.allocatedAmount ?? 0,
          delta: distribution[type],
        };
      }),
      displayDailyCents: computeDisplayDailyCents(
        spendable.dailyAvailableCents,
      ),
    };
  },
});

export const updateIncomeEvent = mutation({
  args: {
    eventId: v.id("incomeEvents"),
    amount: v.number(),
    source: v.union(
      v.literal("payroll"),
      v.literal("freelance"),
      v.literal("business"),
      v.literal("gift"),
      v.literal("refund"),
      v.literal("investment"),
      v.literal("other"),
    ),
    description: v.string(),
    occurredAt: v.number(),
    incomeKind: v.optional(
      v.union(v.literal("habitual"), v.literal("extraordinary")),
    ),
    extraordinaryType: v.optional(extraordinaryTypeValidator),
    extraordinaryLabel: v.optional(v.string()),
    distributionPolicy: v.optional(distributionPolicyValidator),
    allocation: v.optional(allocationPlanValidator),
  },
  handler: async (ctx, args) => {
    const profileGate = await requireActiveAccount(ctx);
    if (!Number.isInteger(args.amount) || args.amount <= 0) {
      throw new ConvexError({
        code: "VALIDATION_ERROR",
        message: "El monto debe ser un entero de céntimos mayor a cero.",
        data: { field: "amount" },
      });
    }

    const incomeKind = args.incomeKind ?? "habitual";
    let resolvedSource = args.source;
    let resolvedDescription = "";
    let distributionPolicy: DistributionPolicy = "profile_default";
    let extraordinaryType: ExtraordinaryType | undefined;
    let extraordinaryLabel: string | undefined;
    let appliedByAutoRule = false;

    if (incomeKind === "extraordinary") {
      if (!args.extraordinaryType) {
        throw new ConvexError({
          code: "VALIDATION_ERROR",
          message: "Elige un tipo de ingreso extraordinario.",
          data: { field: "extraordinaryType" },
        });
      }
      extraordinaryType = args.extraordinaryType;
      if (extraordinaryType === "custom") {
        const label = args.extraordinaryLabel?.trim() ?? "";
        if (!label || label.length > 80) {
          throw new ConvexError({
            code: "VALIDATION_ERROR",
            message:
              "Describe el ingreso (1–80 caracteres) para «Otro extraordinario».",
            data: { field: "extraordinaryLabel" },
          });
        }
        extraordinaryLabel = label;
      } else if (args.extraordinaryLabel?.trim()) {
        throw new ConvexError({
          code: "VALIDATION_ERROR",
          message:
            "La etiqueta personalizada solo aplica a «Otro extraordinario».",
          data: { field: "extraordinaryLabel" },
        });
      }
      resolvedSource = sourceForExtraordinaryType(extraordinaryType);
      resolvedDescription = canonicalExtraordinaryDescription(
        extraordinaryType,
        extraordinaryLabel,
      );
    } else {
      const description = args.description.trim();
      if (!description) {
        throw new ConvexError({
          code: "VALIDATION_ERROR",
          message: "La descripción es obligatoria.",
          data: { field: "description" },
        });
      }
      resolvedDescription = description;
      if (
        args.extraordinaryType !== undefined ||
        args.distributionPolicy !== undefined ||
        args.extraordinaryLabel !== undefined
      ) {
        throw new ConvexError({
          code: "VALIDATION_ERROR",
          message:
            "Los campos extraordinarios solo aplican a ingresos extraordinarios.",
        });
      }
    }

    const event = await ctx.db.get(args.eventId);
    if (!event) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "El ingreso no existe.",
      });
    }

    const profile = profileGate;
    if (event.profileId !== profile._id) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "No tienes permisos para editar este registro.",
      });
    }

    if (incomeKind === "extraordinary" && extraordinaryType) {
      const resolved = resolveExtraordinaryIncomePolicy({
        isPremium: profile.plan === "premium",
        extraordinaryType,
        rules: profile.extraordinaryRules,
        autoApply: profile.extraordinaryRulesAutoApply,
        distributionPolicy: args.distributionPolicy,
      });
      if (!resolved.ok) {
        throw new ConvexError({
          code: "VALIDATION_ERROR",
          message: "Confirma a dónde va este ingreso extraordinario.",
          data: { field: "distributionPolicy" },
        });
      }
      distributionPolicy = resolved.distributionPolicy;
      appliedByAutoRule = resolved.appliedByAutoRule;
    } else if (event.distributionPolicy) {
      distributionPolicy = event.distributionPolicy;
    }

    const cycle = await ctx.db.get(event.cycleId);
    if (cycle?.status !== "active") {
      throw new ConvexError({
        code: "VALIDATION_ERROR",
        message: "Solo puedes editar ingresos del ciclo activo.",
      });
    }

    const now = Date.now();

    if (args.occurredAt < cycle.startDate) {
      throw new ConvexError({
        code: "VALIDATION_ERROR",
        message: "La fecha del ingreso debe estar dentro del ciclo activo.",
        data: { field: "occurredAt" },
      });
    }
    if (args.occurredAt > now) {
      throw new ConvexError({
        code: "VALIDATION_ERROR",
        message: "La fecha del ingreso no puede ser futura.",
        data: { field: "occurredAt" },
      });
    }

    const weights = {
      allocationNeeds: profile.allocationNeeds,
      allocationWants: profile.allocationWants,
      allocationSavings: profile.allocationSavings,
    };

    // Capture prior reservation intents before reversing the ledger.
    const priorLines = await ctx.db
      .query("incomeAllocationLines")
      .withIndex("by_income_event", (q) => q.eq("incomeEventId", args.eventId))
      .collect();
    const priorReservations: Array<{
      commitmentId: Id<"fixedCommitments">;
      amountCents: number;
    }> = [];
    let priorUnallocated = 0;
    for (const line of priorLines) {
      if (
        line.destination === "commitment_reservation" &&
        line.commitmentId &&
        line.amountCents > 0
      ) {
        priorReservations.push({
          commitmentId: line.commitmentId,
          amountCents: line.amountCents,
        });
      } else if (line.destination === "unallocated") {
        priorUnallocated += line.amountCents;
      }
    }

    // 1) Reverse envelopes from old snapshot.
    const oldDistribution = event.distributionApplied;
    const envelopes = await ctx.db
      .query("envelopes")
      .withIndex("by_cycle_type", (q) => q.eq("cycleId", event.cycleId))
      .collect();
    if (!canReverseDistributionApplied(envelopes, oldDistribution)) {
      throw new ConvexError({
        code: "VALIDATION_ERROR",
        message:
          "No puedes editar este ingreso: parte del dinero ya se gastó o movió de los sobres.",
      });
    }
    await Promise.all(
      envelopes.map((env) =>
        ctx.db.patch(env._id, {
          allocatedAmount: env.allocatedAmount - oldDistribution[env.type],
          remainingAmount: env.remainingAmount - oldDistribution[env.type],
        }),
      ),
    );

    // 2) Reverse allocation ledger.
    const reverse = await reverseIncomeAllocationLedger(ctx, {
      profileId: profile._id,
      cycleId: cycle._id,
      incomeEventId: args.eventId,
      now,
      note: "Reverso por edición de ingreso",
    });

    // 3) Build / validate new plan.
    let plan: AllocationPlan;
    if (args.allocation) {
      const validated = validateAllocationPlan(args.amount, {
        reservations: args.allocation.reservations.map((row) => ({
          commitmentId: row.commitmentId,
          amountCents: row.amountCents,
        })),
        envelopes: args.allocation.envelopes,
        savingsContributions: args.allocation.savingsContributions.map(
          (row) => ({
            amountCents: row.amountCents,
            kind: row.kind,
            subEnvelopeId: row.subEnvelopeId,
          }),
        ),
        leaveUnallocatedCents: args.allocation.leaveUnallocatedCents,
      });
      if (!validated.ok) {
        throw new ConvexError({
          code: "VALIDATION_ERROR",
          message: validated.message,
          data: { field: "allocation" },
        });
      }
      plan = {
        reservations: args.allocation.reservations.map((row) => ({
          commitmentId: row.commitmentId,
          amountCents: row.amountCents,
        })),
        envelopes: args.allocation.envelopes,
        savingsContributions: args.allocation.savingsContributions.map(
          (row) => ({
            amountCents: row.amountCents,
            kind: row.kind,
            subEnvelopeId: row.subEnvelopeId,
          }),
        ),
        leaveUnallocatedCents: args.allocation.leaveUnallocatedCents,
      };
    } else {
      // Rebuild: keep prior reservations (capped), migrate orphan held → unallocated.
      const reservedBudget = priorReservations.reduce(
        (sum, row) => sum + row.amountCents,
        0,
      );
      let leaveUnallocated = priorUnallocated;
      if (
        priorReservations.length === 0 &&
        (event.heldCents ?? 0) > 0 &&
        leaveUnallocated === 0
      ) {
        leaveUnallocated = Math.min(event.heldCents ?? 0, args.amount);
      }
      if (reservedBudget + leaveUnallocated > args.amount) {
        // Scale down reservations first, then unallocated.
        const scale =
          args.amount / Math.max(1, reservedBudget + leaveUnallocated);
        leaveUnallocated = Math.floor(leaveUnallocated * scale);
        let remaining = args.amount - leaveUnallocated;
        const scaled: typeof priorReservations = [];
        for (const row of priorReservations) {
          const take = Math.min(row.amountCents, remaining);
          if (take > 0) scaled.push({ ...row, amountCents: take });
          remaining -= take;
        }
        plan = buildDefaultAllocationPlan({
          amountCents: args.amount,
          weights,
          distributionPolicy,
          reservations: scaled,
          leaveUnallocatedCents: leaveUnallocated,
        });
      } else {
        plan = buildDefaultAllocationPlan({
          amountCents: args.amount,
          weights,
          distributionPolicy,
          reservations: priorReservations,
          leaveUnallocatedCents: leaveUnallocated,
        });
      }
    }

    const emergencyFund = (
      await ctx.db
        .query("subEnvelopes")
        .withIndex("by_profile", (q) => q.eq("profileId", profile._id))
        .collect()
    ).find((row) => row.isSystemDefault);

    let addedUnallocated = 0;
    try {
      const persisted = await persistIncomeAllocation(ctx, {
        profileId: profile._id,
        cycleId: cycle._id,
        incomeEventId: args.eventId,
        amountCents: args.amount,
        plan,
        now,
        emergencyFundId: emergencyFund?._id,
      });
      addedUnallocated = persisted.unallocatedCents;
    } catch (error) {
      throw new ConvexError({
        code: "VALIDATION_ERROR",
        message:
          error instanceof Error
            ? error.message
            : "No se pudo aplicar la distribución.",
        data: { field: "allocation" },
      });
    }

    const newDistribution = plan.envelopes;
    const envelopesAfter = await ctx.db
      .query("envelopes")
      .withIndex("by_cycle_type", (q) => q.eq("cycleId", event.cycleId))
      .collect();
    await Promise.all(
      envelopesAfter.map((env) =>
        ctx.db.patch(env._id, {
          allocatedAmount: env.allocatedAmount + newDistribution[env.type],
          remainingAmount: env.remainingAmount + newDistribution[env.type],
        }),
      ),
    );

    const heldCents = plan.reservations.reduce(
      (sum, row) => sum + row.amountCents,
      0,
    );
    const amountDelta = args.amount - event.amount;

    await ctx.db.patch(cycle._id, {
      totalIncomeReceived: cycle.totalIncomeReceived + amountDelta,
      unallocatedCents: Math.max(
        0,
        (cycle.unallocatedCents ?? 0) -
          reverse.unallocatedDeltaCents +
          addedUnallocated,
      ),
    });

    await ctx.db.patch(args.eventId, {
      amount: args.amount,
      source: resolvedSource,
      description: resolvedDescription,
      occurredAt: args.occurredAt,
      incomeKind,
      distributionApplied: newDistribution,
      updatedAt: now,
      ...(heldCents > 0 ? { heldCents } : { heldCents: undefined }),
      ...(incomeKind === "extraordinary" && extraordinaryType !== undefined
        ? {
            extraordinaryType,
            extraordinaryLabel,
            distributionPolicy,
            ...(appliedByAutoRule
              ? { appliedByAutoRule: true }
              : { appliedByAutoRule: undefined }),
          }
        : {
            extraordinaryType: undefined,
            extraordinaryLabel: undefined,
            distributionPolicy: undefined,
            appliedByAutoRule: undefined,
          }),
    });

    await evaluateCommitmentCoverageForCycle(
      ctx,
      profile._id,
      event.cycleId,
      now,
    );

    await markNeedsContentReviewIfSuspicious(ctx, profile._id, [
      resolvedDescription,
      extraordinaryLabel,
    ]);

    return { success: true };
  },
});

export const deleteIncomeEvent = mutation({
  args: { eventId: v.id("incomeEvents") },
  handler: async (ctx, args) => {
    const profileGate = await requireActiveAccount(ctx);

    const event = await ctx.db.get(args.eventId);
    if (!event) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "El ingreso no existe.",
      });
    }

    const profile = profileGate;
    if (event.profileId !== profile._id) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "No tienes permisos para eliminar este registro.",
      });
    }

    const cycle = await ctx.db.get(event.cycleId);
    if (cycle?.status !== "active") {
      throw new ConvexError({
        code: "VALIDATION_ERROR",
        message: "Solo puedes eliminar ingresos del ciclo activo.",
      });
    }

    const envelopes = await ctx.db
      .query("envelopes")
      .withIndex("by_cycle_type", (q) => q.eq("cycleId", cycle._id))
      .collect();
    if (!canReverseDistributionApplied(envelopes, event.distributionApplied)) {
      throw new ConvexError({
        code: "VALIDATION_ERROR",
        message:
          "No puedes eliminar este ingreso: parte del dinero ya se gastó o movió de los sobres.",
      });
    }
    await Promise.all(
      envelopes.map((env) =>
        ctx.db.patch(env._id, {
          allocatedAmount:
            env.allocatedAmount - event.distributionApplied[env.type],
          remainingAmount:
            env.remainingAmount - event.distributionApplied[env.type],
        }),
      ),
    );

    const now = Date.now();
    const reverse = await reverseIncomeAllocationLedger(ctx, {
      profileId: profile._id,
      cycleId: cycle._id,
      incomeEventId: args.eventId,
      now,
      note: "Reverso por eliminación de ingreso",
    });

    await ctx.db.patch(cycle._id, {
      totalIncomeReceived: Math.max(
        0,
        cycle.totalIncomeReceived - event.amount,
      ),
      unallocatedCents: Math.max(
        0,
        (cycle.unallocatedCents ?? 0) - reverse.unallocatedDeltaCents,
      ),
    });

    await ctx.db.delete(args.eventId);

    await evaluateCommitmentCoverageForCycle(ctx, profile._id, cycle._id, now);

    return { success: true };
  },
});
