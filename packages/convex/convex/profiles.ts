import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { isValidAllocations, isValidPaydays } from "./lib/budgetMath";
/**
 * Obtiene el perfil del usuario autenticado actual.
 * Retorna null si el usuario no ha completado el onboarding.
 */
export const getMyProfile = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    // Buscamos el perfil usando el userId string que Better Auth provee
    return await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .unique();
  },
});

/**
 * Crea el perfil financiero del usuario al terminar el Onboarding.
 * Es una mutación atómica: siembra perfil, racha y fondo de emergencia.
 */
export const createProfile = mutation({
  args: {
    name: v.string(),
    country: v.string(),
    currencyCode: v.string(),
    currencySymbol: v.string(),
    workerType: v.union(v.literal("dependent"), v.literal("independent")),
    payFrequency: v.union(v.literal("monthly"), v.literal("biweekly")),
    paydays: v.array(v.number()),
    allocationNeeds: v.number(),
    allocationWants: v.number(),
    allocationSavings: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error(
        "No autorizado. Debes iniciar sesión con tu Passkey o credencial.",
      );
    }

    // Idempotencia primero: si ya existe, no revalidamos ni re-sembramos.
    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .unique();
    if (existing) return existing._id;

    const name = args.name.trim();
    if (!name) throw new Error("El nombre es obligatorio.");

    if (
      !isValidAllocations(
        args.allocationNeeds,
        args.allocationWants,
        args.allocationSavings,
      )
    ) {
      throw new Error(
        "La distribución de sobres (Necesidades, Gustos, Ahorro) debe sumar exactamente 100% con valores enteros no negativos.",
      );
    }
    if (!isValidPaydays(args.payFrequency, args.paydays)) {
      throw new Error(
        "Los días de pago no son válidos para la frecuencia seleccionada.",
      );
    }

    const profileId = await ctx.db.insert("profiles", {
      userId: identity.subject,
      name,
      country: args.country,
      currencyCode: args.currencyCode,
      currencySymbol: args.currencySymbol,
      workerType: args.workerType,
      payFrequency: args.payFrequency,
      paydays: args.paydays,
      allocationNeeds: args.allocationNeeds,
      allocationWants: args.allocationWants,
      allocationSavings: args.allocationSavings,
      onboardingComplete: true,
      plan: "free",
      createdAt: Date.now(),
    });

    // Fondo de Emergencia por defecto: evita el dashboard en blanco tras el onboarding.
    await ctx.db.insert("subEnvelopes", {
      profileId,
      parentEnvelopeType: "savings",
      label: "Fondo de Emergencia",
      emoji: "🛡️",
      currentAmount: 0,
      isSystemDefault: true,
    });

    await ctx.db.insert("streaks", {
      profileId,
      currentStreak: 0,
      longestStreak: 0,
    });

    return profileId;
  },
});

/**
 * Actualiza los porcentajes de pre-compromiso o la configuración de pagos.
 */
export const updateProfileSettings = mutation({
  args: {
    allocationNeeds: v.optional(v.number()),
    allocationWants: v.optional(v.number()),
    allocationSavings: v.optional(v.number()),
    payFrequency: v.optional(
      v.union(v.literal("monthly"), v.literal("biweekly")),
    ),
    paydays: v.optional(v.array(v.number())),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("No autorizado");

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .unique();
    if (!profile) throw new Error("Perfil no encontrado");

    const needs = args.allocationNeeds ?? profile.allocationNeeds;
    const wants = args.allocationWants ?? profile.allocationWants;
    const savings = args.allocationSavings ?? profile.allocationSavings;
    if (!isValidAllocations(needs, wants, savings)) {
      throw new Error(
        "Los porcentajes deben sumar exactamente 100% con valores enteros no negativos.",
      );
    }

    const payFrequency = args.payFrequency ?? profile.payFrequency;
    const paydays = args.paydays ?? profile.paydays;
    if (!isValidPaydays(payFrequency, paydays)) {
      throw new Error(
        "Los días de pago no son válidos para la frecuencia seleccionada.",
      );
    }

    // Convex interpreta `undefined` como "borrar campo": solo incluimos los definidos.
    const updates: Partial<
      Pick<
        Doc<"profiles">,
        | "allocationNeeds"
        | "allocationWants"
        | "allocationSavings"
        | "payFrequency"
        | "paydays"
      >
    > = {};
    if (args.allocationNeeds !== undefined)
      updates.allocationNeeds = args.allocationNeeds;
    if (args.allocationWants !== undefined)
      updates.allocationWants = args.allocationWants;
    if (args.allocationSavings !== undefined)
      updates.allocationSavings = args.allocationSavings;
    if (args.payFrequency !== undefined)
      updates.payFrequency = args.payFrequency;
    if (args.paydays !== undefined) updates.paydays = args.paydays;

    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(profile._id, updates);
    }

    return { success: true };
  },
});
