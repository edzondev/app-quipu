import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getProfileOrThrow } from "./helpers";

// ─── Queries ──────────────────────────────────────────────────────────────────

export const listExtraIncomes = query({
  args: {},
  handler: async (ctx) => {
    const profile = await getProfileOrThrow(ctx);
    return await ctx.db
      .query("extraIncomes")
      .withIndex("by_profileId", (q) => q.eq("profileId", profile._id))
      .order("desc")
      .collect();
  },
});

// ─── Mutations ────────────────────────────────────────────────────────────────

export const addExtraIncome = mutation({
  args: {
    name: v.string(),
    amount: v.number(),
    includeInBudget: v.boolean(),
  },
  returns: v.id("extraIncomes"),
  handler: async (ctx, args) => {
    const profile = await getProfileOrThrow(ctx);

    if (args.amount <= 0) {
      throw new ConvexError("El monto debe ser mayor a 0");
    }

    return await ctx.db.insert("extraIncomes", {
      profileId: profile._id,
      name: args.name,
      amount: args.amount,
      includeInBudget: args.includeInBudget,
      createdAt: Date.now(),
    });
  },
});

export const updateExtraIncome = mutation({
  args: {
    incomeId: v.id("extraIncomes"),
    name: v.optional(v.string()),
    amount: v.optional(v.number()),
    includeInBudget: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const profile = await getProfileOrThrow(ctx);

    const income = await ctx.db.get(args.incomeId);
    if (!income || income.profileId !== profile._id) {
      throw new ConvexError("Ingreso no encontrado");
    }

    if (args.amount !== undefined && args.amount <= 0) {
      throw new ConvexError("El monto debe ser mayor a 0");
    }

    const { incomeId, ...fields } = args;
    const patch: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(fields)) {
      if (val !== undefined) patch[k] = val;
    }

    await ctx.db.patch(args.incomeId, patch);
    return null;
  },
});

export const deleteExtraIncome = mutation({
  args: { incomeId: v.id("extraIncomes") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const profile = await getProfileOrThrow(ctx);

    const income = await ctx.db.get(args.incomeId);
    if (!income || income.profileId !== profile._id) {
      throw new ConvexError("Ingreso no encontrado");
    }

    await ctx.db.delete(args.incomeId);
    return null;
  },
});
