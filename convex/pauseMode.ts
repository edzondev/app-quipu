import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  computeEnvelopes,
  computePauseMode,
  computePauseModeCarryoverFromEnvelopes,
  getProfile,
  getProfileOrThrow,
} from "./helpers";

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Returns the Modo Pausa snapshot for the authenticated user.
 *
 * Soft auth check — returns null if not authenticated or profile missing.
 * When pause mode is inactive, returns `{ active: false }`. Otherwise returns
 * the initial fund, spent total (sum of expenses since activation), and
 * remaining balance, alongside the profile's currency symbol for UI.
 */
export const getPauseStatus = query({
  args: {},
  returns: v.union(
    v.null(),
    v.object({ active: v.literal(false) }),
    v.object({
      active: v.literal(true),
      fund: v.number(),
      startedAt: v.string(),
      spent: v.number(),
      remaining: v.number(),
      currencySymbol: v.string(),
    }),
  ),
  handler: async (ctx) => {
    const profile = await getProfile(ctx);
    if (!profile) return null;

    const snapshot = await computePauseMode(ctx, profile);
    if (!snapshot) return { active: false as const };

    return {
      ...snapshot,
      currencySymbol: profile.currencySymbol,
    };
  },
});

/**
 * Returns the carryover that would be added when activating Modo Pausa.
 *
 * Carryover is computed from positive availability in Necesidades + Gustos
 * for the provided month.
 */
export const getPauseModeActivationPreview = query({
  args: {
    month: v.string(),
  },
  returns: v.union(
    v.null(),
    v.object({
      carryover: v.number(),
      currencySymbol: v.string(),
    }),
  ),
  handler: async (ctx, args) => {
    const profile = await getProfile(ctx);
    if (!profile) return null;

    const computed = await computeEnvelopes(ctx, profile, args.month);
    const carryover = computePauseModeCarryoverFromEnvelopes(computed);

    return {
      carryover,
      currencySymbol: profile.currencySymbol,
    };
  },
});

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * Activates Modo Pausa with an initial disposable fund.
 *
 * The client supplies `today` (YYYY-MM-DD) to keep the mutation deterministic
 * — matches the `getServerCalendarStrings` pattern used elsewhere.
 * Throws when pause mode is already active to prevent accidental overwrites.
 */
export const activatePauseMode = mutation({
  args: {
    liquidation: v.number(),
    month: v.string(),
    today: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const profile = await getProfileOrThrow(ctx);

    if (profile.pauseModeActive === true) {
      throw new ConvexError("Modo Pausa ya está activo");
    }

    const computed = await computeEnvelopes(ctx, profile, args.month);
    const carryover = computePauseModeCarryoverFromEnvelopes(computed);
    const totalFund = args.liquidation + carryover;

    if (args.liquidation < 0) {
      throw new ConvexError("La liquidación no puede ser negativa");
    }
    if (totalFund <= 0) {
      throw new ConvexError(
        "El fondo total debe ser mayor a 0 para activar Modo Pausa",
      );
    }

    await ctx.db.patch(profile._id, {
      pauseModeActive: true,
      pauseModeFund: totalFund,
      pauseModeStartedAt: args.today,
    });

    return null;
  },
});

/**
 * Deactivates Modo Pausa, clearing the three pause fields.
 * Expenses registered during pause remain untouched.
 */
export const deactivatePauseMode = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const profile = await getProfileOrThrow(ctx);

    if (profile.pauseModeActive !== true) {
      throw new ConvexError("Modo Pausa no está activo");
    }

    await ctx.db.patch(profile._id, {
      pauseModeActive: undefined,
      pauseModeFund: undefined,
      pauseModeStartedAt: undefined,
    });

    return null;
  },
});
