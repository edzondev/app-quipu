import { SETTINGS_PLAN_FREE_BODY, SETTINGS_PLAN_RENEWAL_AUTOMATIC } from "../constants";
import type { SettingsOverviewQueryResult } from "../queries";
import type { SettingsOverview, SettingsSubscriptionStatus } from "../types";

export type ConvexSettingsOverview = NonNullable<SettingsOverviewQueryResult>;

function mapSubscriptionStatus(
	status: NonNullable<ConvexSettingsOverview["billing"]>["subscriptionStatus"],
): SettingsSubscriptionStatus {
	if (status === "canceled_at_period_end") return "canceled_at_period_end";
	if (status === "active") return "active";
	return "free";
}

export function mapConvexSettingsOverview(data: ConvexSettingsOverview): SettingsOverview {
	const tier = data.account.plan.tier;
	const isPremium = tier === "premium";
	const billing = data.billing;

	return {
		profile: {
			name: data.account.name,
			email: data.account.email,
			country: data.account.country,
			incomeModelLabel: data.account.incomeModel.label,
			tags: data.account.tags,
			plan: tier,
		},
		subscription: {
			plan: tier,
			status: billing
				? mapSubscriptionStatus(billing.subscriptionStatus)
				: isPremium
					? "active"
					: "free",
			priceDisplay: data.account.plan.priceCopy ?? null,
			renewalSummary:
				billing?.renewalSummary ??
				(isPremium ? SETTINGS_PLAN_RENEWAL_AUTOMATIC : SETTINGS_PLAN_FREE_BODY),
			paymentMethodSummary: null,
			checkoutAvailable: billing?.checkoutAvailable ?? false,
			premiumProductId: billing?.plusProductIds?.monthly ?? billing?.premiumProductId ?? null,
			plusProductIds: {
				monthly: billing?.plusProductIds?.monthly ?? billing?.premiumProductId ?? null,
				yearly: billing?.plusProductIds?.yearly ?? null,
			},
			currencyCode: data.account.currencyCode,
		},
		passkeys: data.security.passkeys.map((pk) => ({
			id: pk.id,
			label: pk.name ?? "Passkey",
			usageSummary: pk.deviceType,
		})),
		sessionsApiReady: data.security.sessions?.apiReady ?? false,
		activeSessionCount: data.security.sessions?.count ?? null,
	};
}
