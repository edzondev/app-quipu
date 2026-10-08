import { Polar } from "@convex-dev/polar";
import { components, internal } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";

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
