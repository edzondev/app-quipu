import { Polar } from "@convex-dev/polar";
import { subscriptionsUpdate } from "@polar-sh/sdk/funcs/subscriptionsUpdate.js";
import { components, internal } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import type { ActionCtx, MutationCtx, QueryCtx } from "./_generated/server";
import {
	cancelPolarSubscriptionForDeletion,
	type PolarDeletionOutcome,
} from "./lib/cancelPolarForDeletion";

/**
 * Quipu Plus: 2 productos Polar (mensual + anual).
 * Multi-moneda (PEN/EUR/USD) vive en el catálogo Polar del mismo product ID.
 *
 * Legacy: POLAR_PRODUCT_ID_PREMIUM → fallback de monthly.
 */
const plusMonthlyId =
	process.env.POLAR_PRODUCT_ID_PLUS_MONTHLY || process.env.POLAR_PRODUCT_ID_PREMIUM || "";
const plusYearlyId = process.env.POLAR_PRODUCT_ID_PLUS_YEARLY || "";

const organizationToken = process.env.POLAR_ORGANIZATION_TOKEN ?? "";
const webhookSecret = process.env.POLAR_WEBHOOK_SECRET ?? "";
const polarServer = (process.env.POLAR_SERVER as "sandbox" | "production") ?? "sandbox";

export const polarProductIds = {
	plusMonthly: plusMonthlyId,
	plusYearly: plusYearlyId,
} as const;

export function listPlusProductIds(): string[] {
	return [plusMonthlyId, plusYearlyId].filter((id) => id.length > 0);
}

export const polar: Polar<DataModel, { plusMonthly: string; plusYearly: string; premium: string }> =
	new Polar(components.polar, {
		getUserInfo: async (ctx) => {
			return await ctx.runQuery(internal.profiles.getMyInternalProfile);
		},
		products: {
			plusMonthly: plusMonthlyId,
			plusYearly: plusYearlyId,
			// Alias legacy para cutover / syncProducts existentes.
			premium: plusMonthlyId,
		},
		organizationToken,
		webhookSecret,
		server: polarServer,
	});

export const {
	generateCheckoutLink,
	generateCustomerPortalUrl,
	getConfiguredProducts,
	listAllProducts,
	cancelCurrentSubscription,
	changeCurrentSubscription,
	listAllSubscriptions,
} = polar.api();

export async function revokePolarSubscription(subscriptionId: string): Promise<void> {
	const updated = await subscriptionsUpdate(polar.polar, {
		id: subscriptionId,
		subscriptionUpdate: { revoke: true },
	});
	if (!updated.ok) {
		throw updated.error;
	}
}

export async function cancelPolarSubscriptionForUserId(
	ctx: QueryCtx | MutationCtx | ActionCtx,
	userId: string,
): Promise<PolarDeletionOutcome> {
	return cancelPolarSubscriptionForDeletion({
		getCurrent: async () => {
			const subscription = await polar.getCurrentSubscription(ctx, { userId });
			if (!subscription) return null;
			return { id: subscription.id, status: subscription.status };
		},
		cancel: revokePolarSubscription,
	});
}
