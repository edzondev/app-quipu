import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  type ComputeEnvelopesResult,
  computeEnvelopes,
  currentMonthString,
  getProfileOrThrow,
  requirePremium,
} from "./helpers";

export type RescueDeficit = {
  needsOverflow: number;
  wantsOverflow: number;
  envelope: "needs" | "wants" | null;
  deficit: number;
};

/**
 * Pure computation shared by getRescueStatus and applyRescueSolution.
 * Determines whether the user is in rescue mode and the size of the deficit.
 */
export function computeRescueDeficit(
  computed: ComputeEnvelopesResult,
): RescueDeficit {
  const needsOverflow =
    computed.envelopes.needs.spent - computed.envelopes.needs.allocated;
  const wantsOverflow =
    computed.envelopes.wants.spent - computed.envelopes.wants.allocated;

  const isInRescue = needsOverflow > 0 || wantsOverflow > 0;
  const envelope = isInRescue ? (needsOverflow > 0 ? "needs" : "wants") : null;
  const deficit =
    envelope === "needs"
      ? needsOverflow
      : envelope === "wants"
        ? wantsOverflow
        : 0;

  return { needsOverflow, wantsOverflow, envelope, deficit };
}

export type RescueTransfer = {
  transferAmount: number;
  targetEnvelope: "needs" | "wants";
};

/**
 * Pure computation for the rescue transfer_from_savings action.
 */
export function computeRescueTransfer(
  computed: ComputeEnvelopesResult,
  savings: number,
): RescueTransfer {
  const { needsOverflow, deficit } = computeRescueDeficit(computed);
  const transferAmount = Math.min(deficit, savings);
  const targetEnvelope = needsOverflow > 0 ? "needs" : "wants";
  return { transferAmount, targetEnvelope };
}

/**
 * Returns the current rescue status for the authenticated user.
 * Soft auth check — returns null if not authenticated.
 */
export const getRescueStatus = query({
  args: {
    month: v.optional(v.string()), // "YYYY-MM" — pass from client for deterministic caching
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .unique();
    if (!profile) return null;

    const month = args.month ?? currentMonthString();
    const computed = await computeEnvelopes(ctx, profile, month);

    const { isInRescue, envelope, envelopeName, deficit } = (() => {
      const result = computeRescueDeficit(computed);
      const envelopeName =
        result.envelope === "needs"
          ? "Necesidades"
          : result.envelope === "wants"
            ? "Gustos"
            : null;
      return {
        isInRescue: result.envelope !== null,
        envelope: result.envelope,
        envelopeName,
        deficit: result.deficit,
      };
    })();

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
      const { transferAmount, targetEnvelope } = computeRescueTransfer(
        computed,
        profile.envelopeSavings ?? 0,
      );
      const savings = profile.envelopeSavings ?? 0;

      if (targetEnvelope === "needs") {
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
