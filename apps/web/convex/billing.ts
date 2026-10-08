import { ConvexError, v } from "convex/values";
import { internalAction, internalMutation, mutation } from "./_generated/server";
import {
	type PolarSubscriptionSnapshot,
	polarSubscriptionFromWebhook,
	resolvePlanTier,
} from "./lib/billingSync";
import { transitionOwnedSpacesOnPlanChange } from "./lib/spaceLifecycle";
import { listPlusProductIds, polar } from "./polar";

function plusProductIdList(): string[] {
	return listPlusProductIds();
}

function snapshotFromPolarSubscription(
	sub: Awaited<ReturnType<typeof polar.getCurrentSubscription>>,
): PolarSubscriptionSnapshot | null {
	if (!sub) return null;
	return {
		id: sub.id,
		customerId: sub.customerId,
		productId: sub.productId,
		status: sub.status,
		currentPeriodEnd: sub.currentPeriodEnd ?? null,
		cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
		productKey: sub.productKey ?? null,
	};
}

export const syncProducts = internalAction({
	args: {},
	returns: v.null(),
	handler: async (ctx) => {
		await polar.syncProducts(ctx);
		return null;
	},
});

export const applyProfilePlanFromPolar = internalMutation({
	args: {
		userId: v.string(),
		polarCustomerId: v.string(),
		polarSubscriptionId: v.string(),
		productId: v.string(),
		status: v.string(),
		currentPeriodEnd: v.union(v.string(), v.null()),
		cancelAtPeriodEnd: v.boolean(),
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const profile = await ctx.db
			.query("profiles")
			.withIndex("by_userId", (q) => q.eq("userId", args.userId))
			.unique();
		if (!profile) {
			console.warn("Polar sync: profile not found for userId", args.userId);
			return null;
		}

		const snapshot = polarSubscriptionFromWebhook({
			id: args.polarSubscriptionId,
			customerId: args.polarCustomerId,
			productId: args.productId,
			status: args.status,
			currentPeriodEnd: args.currentPeriodEnd,
			cancelAtPeriodEnd: args.cancelAtPeriodEnd,
		});

		const plan = resolvePlanTier(snapshot, plusProductIdList());
		const patch: {
			plan: typeof plan;
			polarCustomerId: string;
			polarSubscriptionId?: string;
		} = {
			plan,
			polarCustomerId: args.polarCustomerId,
		};
		if (plan === "premium") {
			patch.polarSubscriptionId = args.polarSubscriptionId;
		}

		await ctx.db.patch(profile._id, patch);

		const updatedProfile = await ctx.db.get("profiles", profile._id);
		if (updatedProfile) {
			await transitionOwnedSpacesOnPlanChange(ctx, updatedProfile);
		}
		return null;
	},
});

export const reconcileMyPlan = mutation({
	args: {},
	returns: v.object({
		plan: v.union(v.literal("free"), v.literal("premium")),
	}),
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new ConvexError({
				code: "UNAUTHORIZED",
				message: "Debes iniciar sesión.",
			});
		}

		const profile = await ctx.db
			.query("profiles")
			.withIndex("by_userId", (q) => q.eq("userId", identity.subject))
			.unique();
		if (!profile) {
			throw new ConvexError({
				code: "NOT_FOUND",
				message: "Perfil no encontrado.",
			});
		}

		const subscription = await polar.getCurrentSubscription(ctx, {
			userId: identity.subject,
		});
		const snapshot = snapshotFromPolarSubscription(subscription);
		const plan = resolvePlanTier(snapshot, plusProductIdList());

		const patch: {
			plan: typeof plan;
			polarCustomerId?: string;
			polarSubscriptionId?: string;
		} = { plan };

		if (snapshot) {
			patch.polarCustomerId = snapshot.customerId;
			if (plan === "premium") {
				patch.polarSubscriptionId = snapshot.id;
			}
		}

		await ctx.db.patch(profile._id, patch);

		const updatedProfile = await ctx.db.get("profiles", profile._id);
		if (updatedProfile) {
			await transitionOwnedSpacesOnPlanChange(ctx, updatedProfile);
		}
		return { plan };
	},
});

export async function loadPolarSubscriptionForUser(
	ctx: Parameters<typeof polar.getCurrentSubscription>[0],
	userId: string,
): Promise<PolarSubscriptionSnapshot | null> {
	const subscription = await polar.getCurrentSubscription(ctx, { userId });
	return snapshotFromPolarSubscription(subscription);
}
