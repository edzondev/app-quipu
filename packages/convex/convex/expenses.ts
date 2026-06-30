import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { shouldWarnWantsBurn } from "./lib/budgetMath";

const FREE_PLAN_MONTHLY_LIMIT = 20;
const RECENT_EXPENSES_LIMIT = 5;
const WANTS_OVERFLOW_EVENT = "WANTS_OVERFLOW_60";
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export const registerExpense = mutation({
  args: {
    amount: v.number(),
    description: v.string(),
    envelopeType: v.union(v.literal("needs"), v.literal("wants")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("No autorizado");
    if (!Number.isInteger(args.amount) || args.amount <= 0) {
      throw new Error("El monto debe ser un entero de céntimos mayor a cero");
    }

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .unique();
    if (!profile) throw new Error("Perfil no encontrado");

    const activeCycle = await ctx.db
      .query("financialCycles")
      .withIndex("by_profile_status", (q) =>
        q.eq("profileId", profile._id).eq("status", "active"),
      )
      .unique();
    if (!activeCycle) {
      throw new Error(
        "No hay un ciclo financiero activo. Procesa tu día de pago primero.",
      );
    }

    if (profile.plan === "free") {
      const counted = await ctx.db
        .query("expenses")
        .withIndex("by_cycle_envelope_time", (q) =>
          q.eq("cycleId", activeCycle._id),
        )
        .take(FREE_PLAN_MONTHLY_LIMIT);

      if (counted.length >= FREE_PLAN_MONTHLY_LIMIT) {
        throw new Error(
          `Has alcanzado el límite de ${FREE_PLAN_MONTHLY_LIMIT} registros de tu plan gratuito este ciclo. Pásate a Premium para registros ilimitados.`,
        );
      }
    }

    const envelope = await ctx.db
      .query("envelopes")
      .withIndex("by_cycle_type", (q) =>
        q.eq("cycleId", activeCycle._id).eq("type", args.envelopeType),
      )
      .unique();
    if (!envelope) throw new Error("Sobre no encontrado en el ciclo actual");

    const now = Date.now();
    const newRemainingAmount = envelope.remainingAmount - args.amount;
    await ctx.db.patch(envelope._id, { remainingAmount: newRemainingAmount });

    const expenseId = await ctx.db.insert("expenses", {
      profileId: profile._id,
      cycleId: activeCycle._id,
      envelopeId: envelope._id,
      amount: args.amount,
      description: args.description,
      timestamp: now,
    });

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
        const daysElapsed = (now - activeCycle.startDate) / MS_PER_DAY;

        await ctx.db.insert("coachInteractions", {
          profileId: profile._id,
          cycleId: activeCycle._id,
          triggerEvent: WANTS_OVERFLOW_EVENT,
          initialNudge: `${profile.name}, has quemado el ${burnPct.toFixed(0)}% de tu sobre de Gustos en solo ${daysElapsed.toFixed(0)} días. A este ritmo te quedarás a cero antes de tu próximo pago. ¿Cómo deseas proceder?`,
          options: [
            {
              id: "freeze_wants",
              label: "❄️ Congelar sobre de Gustos por 3 días",
            },
            {
              id: "suggest_rescue",
              label: "🛡️ Activar Modo Rescate preventivo",
            },
            { id: "ignore", label: "📉 Asumir la pérdida y continuar" },
          ],
          status: "pending",
          createdAt: now,
        });
      }
    }

    return expenseId;
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

export const deleteExpense = mutation({
  args: { expenseId: v.id("expenses") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("No autorizado");

    const expense = await ctx.db.get(args.expenseId);
    if (!expense) throw new Error("El gasto no existe");

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .unique();
    if (!profile || expense.profileId !== profile._id) {
      throw new Error("No tienes permisos para eliminar este registro");
    }

    // Solo el ciclo activo: revertir un ciclo cerrado corrompe el historial ya evaluado.
    const cycle = await ctx.db.get(expense.cycleId);
    if (!cycle || cycle.status !== "active") {
      throw new Error("Solo puedes eliminar gastos del ciclo activo.");
    }

    // Registrar un gasto solo bajó remainingAmount → al borrar, lo devolvemos.
    const envelope = await ctx.db.get(expense.envelopeId);
    if (!envelope)
      throw new Error("El sobre asociado a este gasto ya no existe");
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
