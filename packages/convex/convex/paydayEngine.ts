import { v } from "convex/values";
import { mutation } from "./_generated/server";
import {
  CYCLE_DAYS,
  computeAllocations,
  ENVELOPE_TYPES,
  evaluateCycleCompliance,
  type PayFrequency,
  sumApplicableCommitments,
} from "./lib/budgetMath";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export const processPayday = mutation({
  args: {
    baseIncomeReceived: v.number(),
    extraordinaryIncomeReceived: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("No autorizado");

    if (
      !Number.isInteger(args.baseIncomeReceived) ||
      args.baseIncomeReceived <= 0
    ) {
      throw new Error(
        "El ingreso base debe ser un entero de céntimos mayor a cero",
      );
    }
    if (
      !Number.isInteger(args.extraordinaryIncomeReceived) ||
      args.extraordinaryIncomeReceived < 0
    ) {
      throw new Error(
        "El ingreso extraordinario debe ser un entero de céntimos no negativo",
      );
    }

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .unique();

    if (!profile) throw new Error("Perfil no encontrado");

    const now = Date.now();
    // payFrequency es un union cerrado en el schema → el cast es seguro.
    const payFrequency = profile.payFrequency as PayFrequency;

    const [activeCycle, commitments] = await Promise.all([
      ctx.db
        .query("financialCycles")
        .withIndex("by_profile_status", (q) =>
          q.eq("profileId", profile._id).eq("status", "active"),
        )
        .unique(),
      ctx.db
        .query("fixedCommitments")
        .withIndex("by_profileId", (q) => q.eq("profileId", profile._id))
        .collect(),
    ]);

    // 1. Cerrar ciclo activo y evaluar racha
    if (activeCycle) {
      const [oldEnvelopes, streakRecord] = await Promise.all([
        ctx.db
          .query("envelopes")
          .withIndex("by_cycle_type", (q) => q.eq("cycleId", activeCycle._id))
          .collect(),
        ctx.db
          .query("streaks")
          .withIndex("by_profileId", (q) => q.eq("profileId", profile._id))
          .unique(),
      ]);

      const cycleStatus = evaluateCycleCompliance(oldEnvelopes);

      await ctx.db.insert("cycleHistory", {
        profileId: profile._id,
        cycleId: activeCycle._id,
        status: cycleStatus,
        evaluatedAt: now,
      });

      if (streakRecord) {
        const newCurrent =
          cycleStatus === "failed" ? 0 : streakRecord.currentStreak + 1;

        await ctx.db.patch(streakRecord._id, {
          currentStreak: newCurrent,
          longestStreak: Math.max(newCurrent, streakRecord.longestStreak),
          lastEvaluatedCycleId: activeCycle._id,
        });
      }

      await ctx.db.patch(activeCycle._id, { status: "closed" });
    }

    // 2. Abrir nuevo ciclo
    const totalPeriodIncome =
      args.baseIncomeReceived + args.extraordinaryIncomeReceived;

    const limaDay = Number(
      new Intl.DateTimeFormat("en-US", {
        timeZone: "America/Lima",
        day: "numeric",
      }).format(now),
    );
    const appliedFixedTotal = sumApplicableCommitments(
      commitments,
      payFrequency,
      limaDay,
      profile.paydays,
    );
    const netAvailable = Math.max(0, totalPeriodIncome - appliedFixedTotal);

    const cycleId = await ctx.db.insert("financialCycles", {
      profileId: profile._id,
      startDate: now,
      endDate: now + CYCLE_DAYS[payFrequency] * MS_PER_DAY,
      status: "active",
      baseIncomeReceived: args.baseIncomeReceived,
      extraordinaryIncomeReceived: args.extraordinaryIncomeReceived,
      totalPeriodIncome,
    });

    // 3. Sembrar los 3 sobres en paralelo (eran 3 inserts idénticos copy-paste)
    const allocations = computeAllocations(netAvailable, profile);

    await Promise.all(
      ENVELOPE_TYPES.map((type) =>
        ctx.db.insert("envelopes", {
          profileId: profile._id,
          cycleId,
          type,
          allocatedAmount: allocations[type],
          remainingAmount: allocations[type],
        }),
      ),
    );

    // 4. Alimentar sub-sobre de ahorro sistémico
    if (allocations.savings > 0) {
      const defaultSavings = await ctx.db
        .query("subEnvelopes")
        .withIndex("by_profile", (q) => q.eq("profileId", profile._id))
        .filter((q) => q.eq(q.field("isSystemDefault"), true))
        .unique();

      if (defaultSavings) {
        await ctx.db.patch(defaultSavings._id, {
          currentAmount: defaultSavings.currentAmount + allocations.savings,
        });
      }
    }

    return { success: true, cycleId };
  },
});

/**
 * Registra un ingreso extra ("cachuelo") a mitad de ciclo y lo reparte entre los
 * sobres activos según las allocations del perfil, manteniendo total = base + extraordinario.
 */
export const registerAdHocIncome = mutation({
  args: {
    amount: v.number(),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("No autorizado");

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .unique();
    if (!profile) throw new Error("Perfil no encontrado");

    if (!Number.isInteger(args.amount) || args.amount <= 0) {
      throw new Error("El monto debe ser un entero de céntimos mayor a cero");
    }
    const description = args.description.trim();
    if (!description)
      throw new Error("La descripción del ingreso es obligatoria.");

    const activeCycle = await ctx.db
      .query("financialCycles")
      .withIndex("by_profile_status", (q) =>
        q.eq("profileId", profile._id).eq("status", "active"),
      )
      .unique();
    if (!activeCycle)
      throw new Error("No hay un ciclo activo para asignar este ingreso");

    const envelopes = await ctx.db
      .query("envelopes")
      .withIndex("by_cycle_type", (q) => q.eq("cycleId", activeCycle._id))
      .collect();

    // Reparto entero que suma exacto args.amount (sin drift de céntimos).
    const split = computeAllocations(args.amount, profile);

    await Promise.all(
      envelopes.map((env) =>
        ctx.db.patch(env._id, {
          allocatedAmount: env.allocatedAmount + split[env.type],
          remainingAmount: env.remainingAmount + split[env.type],
        }),
      ),
    );

    if (split.savings > 0) {
      const defaultSavings = await ctx.db
        .query("subEnvelopes")
        .withIndex("by_profile", (q) => q.eq("profileId", profile._id))
        .filter((q) => q.eq(q.field("isSystemDefault"), true))
        .unique();
      if (defaultSavings) {
        await ctx.db.patch(defaultSavings._id, {
          currentAmount: defaultSavings.currentAmount + split.savings,
        });
      }
    }

    // Guardamos el split para poder revertir exacto si luego se borra.
    await ctx.db.insert("adHocIncomes", {
      profileId: profile._id,
      cycleId: activeCycle._id,
      amount: args.amount,
      description,
      timestamp: Date.now(),
      split,
    });

    // El extra protege el sueldo base pero mantiene total = base + extraordinario.
    await ctx.db.patch(activeCycle._id, {
      extraordinaryIncomeReceived:
        activeCycle.extraordinaryIncomeReceived + args.amount,
      totalPeriodIncome: activeCycle.totalPeriodIncome + args.amount,
    });

    return { success: true };
  },
});

export const deleteAdHocIncome = mutation({
  args: { incomeId: v.id("adHocIncomes") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("No autorizado");

    const income = await ctx.db.get(args.incomeId);
    if (!income) throw new Error("El ingreso no existe");

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .unique();
    if (!profile || income.profileId !== profile._id) {
      throw new Error("No tienes permisos para eliminar este registro");
    }

    // Solo el ciclo activo: revertir un ciclo cerrado corrompe el historial ya evaluado.
    const cycle = await ctx.db.get(income.cycleId);
    if (!cycle || cycle.status !== "active") {
      throw new Error("Solo puedes eliminar ingresos del ciclo activo.");
    }

    const { split } = income;

    // Revertir el reparto EXACTO que se aplicó al registrar.
    const envelopes = await ctx.db
      .query("envelopes")
      .withIndex("by_cycle_type", (q) => q.eq("cycleId", cycle._id))
      .collect();

    await Promise.all(
      envelopes.map((env) =>
        ctx.db.patch(env._id, {
          allocatedAmount: env.allocatedAmount - split[env.type],
          remainingAmount: env.remainingAmount - split[env.type],
        }),
      ),
    );

    if (split.savings > 0) {
      const defaultSavings = await ctx.db
        .query("subEnvelopes")
        .withIndex("by_profile", (q) => q.eq("profileId", profile._id))
        .filter((q) => q.eq(q.field("isSystemDefault"), true))
        .unique();
      if (defaultSavings) {
        await ctx.db.patch(defaultSavings._id, {
          currentAmount: defaultSavings.currentAmount - split.savings,
        });
      }
    }

    await ctx.db.patch(cycle._id, {
      extraordinaryIncomeReceived:
        cycle.extraordinaryIncomeReceived - income.amount,
      totalPeriodIncome: cycle.totalPeriodIncome - income.amount,
    });

    await ctx.db.delete(args.incomeId);
    return { success: true };
  },
});
