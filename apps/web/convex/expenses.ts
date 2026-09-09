import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { shouldWarnWantsBurn } from "./lib/budgetMath";
import {
  buildWantsOverflowNudge,
  WANTS_OVERFLOW_EVENT,
} from "./lib/coachState";
import { computeCycleDayMetrics } from "./lib/dashboardMath";
import { requireActiveAccount } from "./lib/entitlements";
import { isEnvelopeFrozen } from "./lib/envelopeGuards";
import { markNeedsContentReviewIfSuspicious } from "./lib/markNeedsContentReview";
import {
  computeDailyImpact,
  computeSpendableCents,
} from "./lib/spendableBalance";

const RECENT_EXPENSES_LIMIT = 5;

export const registerExpense = mutation({
  args: {
    amount: v.number(),
    description: v.string(),
    envelopeType: v.union(v.literal("needs"), v.literal("wants")),
  },
  handler: async (ctx, args) => {
    const profile = await requireActiveAccount(ctx);
    if (!Number.isInteger(args.amount) || args.amount <= 0) {
      throw new ConvexError({
        code: "VALIDATION_ERROR",
        message: "El monto debe ser un entero de céntimos mayor a cero",
        data: { field: "amount" },
      });
    }

    const activeCycle = await ctx.db
      .query("financialCycles")
      .withIndex("by_profile_status", (q) =>
        q.eq("profileId", profile._id).eq("status", "active"),
      )
      .unique();
    if (!activeCycle) {
      throw new ConvexError({
        code: "VALIDATION_ERROR",
        message:
          "No hay un ciclo financiero activo. Procesa tu día de pago primero.",
      });
    }

    // v2.5: Plan Free es ilimitado. El valor de Premium es automatización,
    // no restricción de registros.

    // Ambos sobres gastables: para el hero solo cuenta needs + wants.
    const cycleEnvelopes = await ctx.db
      .query("envelopes")
      .withIndex("by_cycle_type", (q) => q.eq("cycleId", activeCycle._id))
      .collect();
    const envelope = cycleEnvelopes.find((e) => e.type === args.envelopeType);
    if (!envelope) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Sobre no encontrado en el ciclo actual.",
      });
    }

    const now = Date.now();
    if (isEnvelopeFrozen(envelope.frozenUntil, now)) {
      throw new ConvexError({
        code: "ENVELOPE_FROZEN",
        message:
          "Este sobre está congelado temporalmente. Espera a que termine el congelamiento o elige otro sobre.",
        data: { field: "envelopeType" },
      });
    }

    const needsRemainingBefore =
      cycleEnvelopes.find((e) => e.type === "needs")?.remainingAmount ?? 0;
    const wantsRemainingBefore =
      cycleEnvelopes.find((e) => e.type === "wants")?.remainingAmount ?? 0;
    const spendableBeforeCents = computeSpendableCents({
      needsRemainingCents: needsRemainingBefore,
      wantsRemainingCents: wantsRemainingBefore,
    });

    const newRemainingAmount = envelope.remainingAmount - args.amount;
    await ctx.db.patch(envelope._id, { remainingAmount: newRemainingAmount });

    const spendableAfterCents = computeSpendableCents({
      needsRemainingCents:
        args.envelopeType === "needs"
          ? newRemainingAmount
          : needsRemainingBefore,
      wantsRemainingCents:
        args.envelopeType === "wants"
          ? newRemainingAmount
          : wantsRemainingBefore,
    });

    const expenseId = await ctx.db.insert("expenses", {
      profileId: profile._id,
      cycleId: activeCycle._id,
      envelopeId: envelope._id,
      amount: args.amount,
      description: args.description,
      timestamp: now,
    });

    await markNeedsContentReviewIfSuspicious(ctx, profile._id, [
      args.description,
    ]);

    if (
      args.envelopeType === "wants" &&
      shouldWarnWantsBurn({
        allocated: envelope.allocatedAmount,
        remaining: newRemainingAmount,
        cycleStart: activeCycle.startDate,
        cycleEnd: activeCycle.endDate,
        now,
      })
    ) {
      const existing = await ctx.db
        .query("coachInteractions")
        .withIndex("by_profile_status", (q) =>
          q.eq("profileId", profile._id).eq("status", "pending"),
        )
        .filter((q) => q.eq(q.field("triggerEvent"), WANTS_OVERFLOW_EVENT))
        .first();

      if (!existing) {
        const burnPct =
          ((envelope.allocatedAmount - newRemainingAmount) /
            envelope.allocatedAmount) *
          100;
        const { daysElapsed } = computeCycleDayMetrics(
          activeCycle.startDate,
          activeCycle.endDate,
          now,
        );
        const nudge = buildWantsOverflowNudge({
          profileName: profile.name,
          burnPercent: burnPct,
          daysElapsed,
        });

        await ctx.db.insert("coachInteractions", {
          profileId: profile._id,
          cycleId: activeCycle._id,
          triggerEvent: nudge.triggerEvent,
          initialNudge: nudge.initialNudge,
          options: nudge.options,
          status: "pending",
          createdAt: now,
        });
      }
    }

    const daysRemainingInCycle = computeCycleDayMetrics(
      activeCycle.startDate,
      activeCycle.endDate,
      now,
    ).daysRemaining;

    const dailyImpact = computeDailyImpact({
      spendableBeforeCents,
      spendableAfterCents,
      daysRemaining: daysRemainingInCycle,
    });

    return {
      expenseId,
      envelopeType: args.envelopeType,
      amount: args.amount,
      remainingAmount: newRemainingAmount,
      cycleId: activeCycle._id,
      daysRemainingInCycle,
      spendableCents: spendableAfterCents,
      dailyBeforeCents: dailyImpact.dailyBeforeCents,
      dailyAfterCents: dailyImpact.dailyAfterCents,
      dailyDeltaCents: dailyImpact.dailyDeltaCents,
    };
  },
});

export const getRecentExpenses = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .unique();
    if (!profile) return [];

    const activeCycle = await ctx.db
      .query("financialCycles")
      .withIndex("by_profile_status", (q) =>
        q.eq("profileId", profile._id).eq("status", "active"),
      )
      .unique();
    if (!activeCycle) return [];

    const expenses = await ctx.db
      .query("expenses")
      .withIndex("by_cycle_envelope_time", (q) =>
        q.eq("cycleId", activeCycle._id),
      )
      .order("desc")
      .take(RECENT_EXPENSES_LIMIT);

    return expenses.map((e) => ({
      _id: e._id,
      amount: e.amount,
      description: e.description,
      timestamp: e.timestamp,
      envelopeId: e.envelopeId,
    }));
  },
});

export const updateExpense = mutation({
  args: {
    expenseId: v.id("expenses"),
    amount: v.number(),
    description: v.string(),
    envelopeType: v.union(v.literal("needs"), v.literal("wants")),
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
    if (args.description.length > 120) {
      throw new ConvexError({
        code: "VALIDATION_ERROR",
        message: "La descripción no puede superar 120 caracteres.",
        data: { field: "description" },
      });
    }

    const expense = await ctx.db.get(args.expenseId);
    if (!expense) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "El gasto no existe.",
      });
    }

    const profile = profileGate;
    if (expense.profileId !== profile._id) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "No tienes permisos para editar este registro.",
      });
    }

    const cycle = await ctx.db.get(expense.cycleId);
    if (cycle?.status !== "active") {
      throw new ConvexError({
        code: "VALIDATION_ERROR",
        message: "Solo puedes editar gastos del ciclo activo.",
      });
    }

    const oldEnvelope = await ctx.db.get(expense.envelopeId);
    if (!oldEnvelope) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "El sobre asociado a este gasto ya no existe.",
      });
    }

    const now = Date.now();
    let newEnvelopeId = expense.envelopeId;

    if (oldEnvelope.type === args.envelopeType) {
      // Same envelope: delta-patch remaining amount.
      const delta = args.amount - expense.amount;
      if (delta > 0 && isEnvelopeFrozen(oldEnvelope.frozenUntil, now)) {
        throw new ConvexError({
          code: "ENVELOPE_FROZEN",
          message:
            "Este sobre está congelado temporalmente. No puedes aumentar el gasto aquí todavía.",
          data: { field: "envelopeType" },
        });
      }
      await ctx.db.patch(oldEnvelope._id, {
        remainingAmount: oldEnvelope.remainingAmount - delta,
      });
    } else {
      // Envelope type changed: restore to old, deduct from new.
      await ctx.db.patch(oldEnvelope._id, {
        remainingAmount: oldEnvelope.remainingAmount + expense.amount,
      });

      const newEnvelope = await ctx.db
        .query("envelopes")
        .withIndex("by_cycle_type", (q) =>
          q.eq("cycleId", expense.cycleId).eq("type", args.envelopeType),
        )
        .unique();
      if (!newEnvelope) {
        throw new ConvexError({
          code: "NOT_FOUND",
          message: "El sobre destino no existe en el ciclo actual.",
        });
      }
      if (isEnvelopeFrozen(newEnvelope.frozenUntil, now)) {
        throw new ConvexError({
          code: "ENVELOPE_FROZEN",
          message:
            "El sobre destino está congelado temporalmente. Elige otro sobre.",
          data: { field: "envelopeType" },
        });
      }
      await ctx.db.patch(newEnvelope._id, {
        remainingAmount: newEnvelope.remainingAmount - args.amount,
      });
      newEnvelopeId = newEnvelope._id;
    }

    await ctx.db.patch(args.expenseId, {
      amount: args.amount,
      description: args.description.trim(),
      envelopeId: newEnvelopeId,
      updatedAt: now,
    });

    // Re-evaluate coach burn warning when wants envelope is involved.
    if (args.envelopeType === "wants") {
      const wantsEnvelope = await ctx.db
        .query("envelopes")
        .withIndex("by_cycle_type", (q) =>
          q.eq("cycleId", expense.cycleId).eq("type", "wants"),
        )
        .unique();
      if (
        wantsEnvelope &&
        cycle &&
        shouldWarnWantsBurn({
          allocated: wantsEnvelope.allocatedAmount,
          remaining: wantsEnvelope.remainingAmount,
          cycleStart: cycle.startDate,
          cycleEnd: cycle.endDate,
          now,
        })
      ) {
        const existing = await ctx.db
          .query("coachInteractions")
          .withIndex("by_profile_status", (q) =>
            q.eq("profileId", profile._id).eq("status", "pending"),
          )
          .filter((q) => q.eq(q.field("triggerEvent"), WANTS_OVERFLOW_EVENT))
          .first();

        if (!existing) {
          const burnPct =
            ((wantsEnvelope.allocatedAmount - wantsEnvelope.remainingAmount) /
              wantsEnvelope.allocatedAmount) *
            100;
          const { daysElapsed } = computeCycleDayMetrics(
            cycle.startDate,
            cycle.endDate,
            now,
          );
          const nudge = buildWantsOverflowNudge({
            profileName: profile.name,
            burnPercent: burnPct,
            daysElapsed,
          });
          await ctx.db.insert("coachInteractions", {
            profileId: profile._id,
            cycleId: expense.cycleId,
            triggerEvent: nudge.triggerEvent,
            initialNudge: nudge.initialNudge,
            options: nudge.options,
            status: "pending",
            createdAt: now,
          });
        }
      }
    }

    await markNeedsContentReviewIfSuspicious(ctx, profile._id, [
      args.description,
    ]);

    return { success: true };
  },
});

export const deleteExpense = mutation({
  args: { expenseId: v.id("expenses") },
  handler: async (ctx, args) => {
    const profileGate = await requireActiveAccount(ctx);

    const expense = await ctx.db.get(args.expenseId);
    if (!expense) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "El gasto no existe.",
      });
    }

    const profile = profileGate;
    if (expense.profileId !== profile._id) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "No tienes permisos para eliminar este registro.",
      });
    }

    // Solo el ciclo activo: revertir un ciclo cerrado corrompe el historial ya evaluado.
    const cycle = await ctx.db.get(expense.cycleId);
    if (cycle?.status !== "active") {
      throw new ConvexError({
        code: "VALIDATION_ERROR",
        message: "Solo puedes eliminar gastos del ciclo activo.",
      });
    }

    // Registrar un gasto solo bajó remainingAmount → al borrar, lo devolvemos.
    const envelope = await ctx.db.get(expense.envelopeId);
    if (!envelope) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "El sobre asociado a este gasto ya no existe.",
      });
    }
    await ctx.db.patch(envelope._id, {
      remainingAmount: envelope.remainingAmount + expense.amount,
    });

    // Si el gasto salió de un sub-sobre de ahorro, también lo restauramos.
    if (expense.subEnvelopeId) {
      const sub = await ctx.db.get(expense.subEnvelopeId);
      if (sub) {
        await ctx.db.patch(sub._id, {
          currentAmount: sub.currentAmount + expense.amount,
        });
      }
    }

    await ctx.db.delete(args.expenseId);
    return { success: true };
  },
});
