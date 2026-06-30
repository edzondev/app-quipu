import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const listMyCommitments = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .unique();
    if (!profile) return [];

    return await ctx.db
      .query("fixedCommitments")
      .withIndex("by_profileId", (q) => q.eq("profileId", profile._id))
      .collect();
  },
});

export const createFixedCommitment = mutation({
  args: {
    name: v.string(),
    amount: v.number(),
    envelope: v.union(v.literal("needs"), v.literal("wants")),
    frequency: v.union(
      v.literal("monthly"),
      v.literal("first_payday"),
      v.literal("second_payday"),
      v.literal("every_payday"),
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("No autorizado");

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .unique();
    if (!profile) throw new Error("Perfil no encontrado");

    const name = args.name.trim();
    if (!name) throw new Error("El nombre del compromiso es obligatorio.");
    if (!Number.isInteger(args.amount) || args.amount <= 0) {
      throw new Error("El monto debe ser un entero de céntimos mayor a cero.");
    }

    // Un perfil mensual no tiene quincenas: forzamos "monthly" para no guardar basura.
    const frequency =
      profile.payFrequency === "monthly" ? "monthly" : args.frequency;

    return await ctx.db.insert("fixedCommitments", {
      profileId: profile._id,
      name,
      amount: args.amount,
      envelope: args.envelope,
      frequency,
    });
  },
});

export const deleteFixedCommitment = mutation({
  args: { commitmentId: v.id("fixedCommitments") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("No autorizado");

    const commitment = await ctx.db.get(args.commitmentId);
    if (!commitment) throw new Error("Compromiso no encontrado");

    const profile = await ctx.db.get(commitment.profileId);
    if (!profile || profile.userId !== identity.subject) {
      throw new Error("No tienes permisos para eliminar este registro.");
    }

    await ctx.db.delete(args.commitmentId);
    return { success: true };
  },
});
