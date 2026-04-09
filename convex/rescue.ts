import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  computeEnvelopes,
  currentMonthString,
  getProfileOrThrow,
  requirePremium,
} from "./helpers";

/**
 * Returns the current rescue status for the authenticated user.
 * Soft auth check — returns null if not authenticated.
 */
export const getRescueStatus = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .unique();
    if (!profile) return null;

    const month = currentMonthString();
    const computed = await computeEnvelopes(ctx, profile, month);

    const needsOverflow =
      computed.envelopes.needs.spent - computed.envelopes.needs.allocated;
    const wantsOverflow =
      computed.envelopes.wants.spent - computed.envelopes.wants.allocated;

    const isInRescue = needsOverflow > 0 || wantsOverflow > 0;

    // needs has priority over wants
    const envelope =
      needsOverflow > 0 ? "needs" : wantsOverflow > 0 ? "wants" : null;
    const envelopeName =
      envelope === "needs"
        ? "Necesidades"
        : envelope === "wants"
          ? "Gustos"
          : null;
    const deficit =
      envelope === "needs"
        ? needsOverflow
        : envelope === "wants"
          ? wantsOverflow
          : 0;

    const savings = profile.envelopeSavings ?? 0;
    const transferAmount = Math.min(deficit, savings);
    const symbol = profile.currencySymbol;

    return {
      isInRescue,
      envelope,
      envelopeName,
      deficit,
      currencySymbol: symbol,
      availableActions: [
        {
          actionId: "transfer_from_savings",
          title: `Mover ${symbol} ${transferAmount.toFixed(2)} desde Ahorro`,
          subtitle: "para cubrir parte del déficit",
          amount: transferAmount,
          disabled: savings === 0,
          disabledReason:
            savings === 0
              ? "Tu sobre de ahorro está vacío por ahora. ¡La próxima entrada lo rellenará!"
              : undefined,
        },
        {
          actionId: "pause_savings_contribution",
          title: "Pausar la contribución a Ahorro este mes",
          subtitle: "Libera fondos para equilibrar tus sobres",
          amount: 0,
          disabled: false,
          disabledReason: undefined,
        },
      ],
    };
  },
});

/**
 * Applies a rescue solution selected by the user.
 */
export const applyRescueSolution = mutation({
  args: {
    actionId: v.union(
      v.literal("transfer_from_savings"),
      v.literal("pause_savings_contribution"),
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const profile = await getProfileOrThrow(ctx);
    requirePremium(profile.plan);
    const month = currentMonthString();

    if (args.actionId === "transfer_from_savings") {
      const computed = await computeEnvelopes(ctx, profile, month);

      const needsOverflow =
        computed.envelopes.needs.spent - computed.envelopes.needs.allocated;
      const wantsOverflow =
        computed.envelopes.wants.spent - computed.envelopes.wants.allocated;

      const deficit =
        needsOverflow > 0
          ? needsOverflow
          : wantsOverflow > 0
            ? wantsOverflow
            : 0;

      const savings = profile.envelopeSavings ?? 0;
      const transferAmount = Math.min(deficit, savings);

      if (needsOverflow > 0) {
        await ctx.db.patch(profile._id, {
          envelopeSavings: savings - transferAmount,
          envelopeNeeds: (profile.envelopeNeeds ?? 0) + transferAmount,
          rescueAppliedAt: Date.now(),
          rescueActionId: args.actionId,
        });
      } else {
        await ctx.db.patch(profile._id, {
          envelopeSavings: savings - transferAmount,
          envelopeWants: (profile.envelopeWants ?? 0) + transferAmount,
          rescueAppliedAt: Date.now(),
          rescueActionId: args.actionId,
        });
      }
    } else if (args.actionId === "pause_savings_contribution") {
      await ctx.db.patch(profile._id, {
        rescuePausedSavingsMonth: month,
        rescueAppliedAt: Date.now(),
        rescueActionId: args.actionId,
      });
    } else {
      throw new ConvexError("Acción no reconocida");
    }

    return null;
  },
});
