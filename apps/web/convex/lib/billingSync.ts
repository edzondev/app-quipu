import type { Doc } from "../_generated/dataModel";

const LIMA_TIMEZONE = "America/Lima";
const LIMA_SHORT_DATE_FORMATTER = new Intl.DateTimeFormat("es-PE", {
	day: "numeric",
	month: "short",
	timeZone: LIMA_TIMEZONE,
});

export type PlanTier = Doc<"profiles">["plan"];

export type PolarSubscriptionSnapshot = {
	id: string;
	customerId: string;
	productId: string;
	status: string;
	currentPeriodEnd: string | null;
	cancelAtPeriodEnd: boolean;
	productKey?: string | null;
};

export type BillingOverview = {
	tier: PlanTier;
	subscriptionStatus: "free" | "active" | "canceled_at_period_end";
	renewalSummary: string | null;
	cancelAtPeriodEnd: boolean;
	checkoutAvailable: boolean;
	/** @deprecated Prefer plusProductIds.monthly */
	premiumProductId: string | null;
	plusProductIds: {
		monthly: string | null;
		yearly: string | null;
	};
};

const ACTIVE_STATUSES = new Set(["active", "trialing"]);
const PREMIUM_PRODUCT_KEYS = new Set(["premium", "plusMonthly", "plusYearly"]);

export function isPremiumPolarSubscription(
	subscription: PolarSubscriptionSnapshot | null,
	premiumProductIds: string | readonly string[],
): boolean {
	if (!subscription) return false;
	const ids = (Array.isArray(premiumProductIds) ? premiumProductIds : [premiumProductIds]).filter(
		(id) => id.length > 0,
	);
	if (ids.length === 0) return false;

	const matchesProduct =
		ids.includes(subscription.productId) ||
		(subscription.productKey != null && PREMIUM_PRODUCT_KEYS.has(subscription.productKey));
	if (!matchesProduct) return false;
	if (!ACTIVE_STATUSES.has(subscription.status)) return false;
	return true;
}

export function resolvePlanTier(
	subscription: PolarSubscriptionSnapshot | null,
	premiumProductIds: string | readonly string[],
): PlanTier {
	return isPremiumPolarSubscription(subscription, premiumProductIds) ? "premium" : "free";
}

function formatLimaShortDate(isoOrNull: string | null): string | null {
	if (!isoOrNull) return null;
	const ms = Date.parse(isoOrNull);
	if (Number.isNaN(ms)) return null;
	return LIMA_SHORT_DATE_FORMATTER.format(ms);
}

export function buildRenewalSummary(
	subscription: PolarSubscriptionSnapshot | null,
	premiumProductIds: string | readonly string[],
	copy: {
		freeBody: string;
		renewalPrefix: string;
		renewalAutomatic: string;
		canceledUntil: string;
	},
): string | null {
	if (!isPremiumPolarSubscription(subscription, premiumProductIds)) {
		return copy.freeBody;
	}
	const endLabel = formatLimaShortDate(subscription?.currentPeriodEnd ?? null);
	if (subscription?.cancelAtPeriodEnd && endLabel) {
		return `${copy.canceledUntil} ${endLabel}`;
	}
	if (endLabel) {
		return `${copy.renewalPrefix} · ${endLabel}`;
	}
	return copy.renewalAutomatic;
}

export function buildBillingOverview(
	subscription: PolarSubscriptionSnapshot | null,
	productIds: {
		monthly: string;
		yearly: string;
	},
	copy: {
		freeBody: string;
		renewalPrefix: string;
		renewalAutomatic: string;
		canceledUntil: string;
	},
): BillingOverview {
	const allIds = [productIds.monthly, productIds.yearly].filter((id) => id.length > 0);
	const tier = resolvePlanTier(subscription, allIds);
	const isPremium = tier === "premium";
	const cancelAtPeriodEnd = Boolean(isPremium && subscription?.cancelAtPeriodEnd);
	const monthly = productIds.monthly || null;
	const yearly = productIds.yearly || null;

	return {
		tier,
		subscriptionStatus: !isPremium
			? "free"
			: cancelAtPeriodEnd
				? "canceled_at_period_end"
				: "active",
		renewalSummary: buildRenewalSummary(subscription, allIds, copy),
		cancelAtPeriodEnd,
		checkoutAvailable: Boolean(monthly || yearly),
		premiumProductId: monthly,
		plusProductIds: { monthly, yearly },
	};
}

export function extractUserIdFromPolarCustomerMetadata(
	metadata: Record<string, unknown> | undefined,
	externalId?: string | null,
): string | null {
	const userId = metadata?.userId;
	if (typeof userId === "string" && userId.length > 0) return userId;
	if (typeof externalId === "string" && externalId.length > 0) return externalId;
	return null;
}

export function polarSubscriptionFromWebhook(data: {
	id: string;
	customerId: string;
	productId: string;
	status: string;
	currentPeriodEnd: Date | string | null;
	cancelAtPeriodEnd: boolean;
}): PolarSubscriptionSnapshot {
	const currentPeriodEnd =
		data.currentPeriodEnd instanceof Date
			? data.currentPeriodEnd.toISOString()
			: data.currentPeriodEnd;
	return {
		id: data.id,
		customerId: data.customerId,
		productId: data.productId,
		status: data.status,
		currentPeriodEnd,
		cancelAtPeriodEnd: data.cancelAtPeriodEnd,
	};
}
