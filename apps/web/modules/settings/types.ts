import type { Doc } from "@/convex/_generated/dataModel";

/** Shape expected from `api.settings.getSettingsOverview` (backend sibling). */
export type SettingsOverview = {
	profile: SettingsProfileOverview;
	subscription: SettingsSubscriptionOverview;
	passkeys: SettingsPasskeyOverview[];
	/** When false, session management actions stay disabled with honest copy. */
	sessionsApiReady: boolean;
	activeSessionCount?: number | null;
};

export type SettingsProfileOverview = {
	name: string;
	email: string | null;
	country: string;
	incomeModelLabel: string;
	tags: string[];
	plan: Doc<"profiles">["plan"];
};

export type SettingsSubscriptionStatus = "free" | "active" | "canceled_at_period_end";

export type SettingsSubscriptionOverview = {
	plan: Doc<"profiles">["plan"];
	status: SettingsSubscriptionStatus;
	priceDisplay: string | null;
	renewalSummary: string | null;
	paymentMethodSummary: string | null;
	checkoutAvailable: boolean;
	/** @deprecated Prefer plusProductIds.monthly */
	premiumProductId: string | null;
	plusProductIds: {
		monthly: string | null;
		yearly: string | null;
	};
	currencyCode: string;
};

export type SettingsPasskeyOverview = {
	id: string;
	label: string;
	usageSummary: string;
};
