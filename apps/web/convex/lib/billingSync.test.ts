import { describe, expect, it } from "vitest";
import {
	buildBillingOverview,
	isPremiumPolarSubscription,
	type PolarSubscriptionSnapshot,
	resolvePlanTier,
} from "./billingSync";

const MONTHLY = "prod_monthly";
const YEARLY = "prod_yearly";
const copy = {
	freeBody: "Gratis",
	renewalPrefix: "Próxima renovación",
	renewalAutomatic: "Renovación automática",
	canceledUntil: "Cancelado · activo hasta",
};

function polarSnapshot(
	overrides: Partial<PolarSubscriptionSnapshot> & Pick<PolarSubscriptionSnapshot, "status">,
): PolarSubscriptionSnapshot {
	return {
		id: "sub_1",
		customerId: "cus_1",
		productId: MONTHLY,
		currentPeriodEnd: null,
		cancelAtPeriodEnd: false,
		...overrides,
	};
}

describe("isPremiumPolarSubscription", () => {
	it("accepts monthly or yearly product ids", () => {
		expect(
			isPremiumPolarSubscription(
				{
					id: "sub_1",
					customerId: "cus_1",
					productId: YEARLY,
					status: "active",
					currentPeriodEnd: null,
					cancelAtPeriodEnd: false,
				},
				[MONTHLY, YEARLY],
			),
		).toBe(true);
	});

	it("accepts plus product keys", () => {
		expect(
			isPremiumPolarSubscription(
				{
					id: "sub_1",
					customerId: "cus_1",
					productId: "other",
					status: "active",
					currentPeriodEnd: null,
					cancelAtPeriodEnd: false,
					productKey: "plusYearly",
				},
				[MONTHLY, YEARLY],
			),
		).toBe(true);
	});

	it("returns false when canceled", () => {
		expect(
			isPremiumPolarSubscription(
				{
					id: "sub_1",
					customerId: "cus_1",
					productId: MONTHLY,
					status: "canceled",
					currentPeriodEnd: null,
					cancelAtPeriodEnd: false,
				},
				[MONTHLY, YEARLY],
			),
		).toBe(false);
	});
});

describe("resolvePlanTier", () => {
	it("maps active subscription to premium", () => {
		expect(
			resolvePlanTier(
				{
					id: "sub_1",
					customerId: "cus_1",
					productId: MONTHLY,
					status: "trialing",
					currentPeriodEnd: null,
					cancelAtPeriodEnd: false,
				},
				[MONTHLY, YEARLY],
			),
		).toBe("premium");
	});

	it("defaults to free without subscription", () => {
		expect(resolvePlanTier(null, [MONTHLY, YEARLY])).toBe("free");
	});
});

describe("buildBillingOverview", () => {
	it("exposes monthly and yearly product ids", () => {
		const overview = buildBillingOverview(null, { monthly: MONTHLY, yearly: YEARLY }, copy);
		expect(overview.plusProductIds).toEqual({
			monthly: MONTHLY,
			yearly: YEARLY,
		});
		expect(overview.premiumProductId).toBe(MONTHLY);
		expect(overview.checkoutAvailable).toBe(true);
	});

	it("keeps past_due and unpaid as free but blocks deletion until Polar cancel", () => {
		for (const status of ["past_due", "unpaid"]) {
			const overview = buildBillingOverview(
				polarSnapshot({ status }),
				{ monthly: MONTHLY, yearly: YEARLY },
				copy,
			);
			expect(overview.subscriptionStatus).toBe("free");
			expect(overview.deleteBlockedBySubscription).toBe(true);
		}
	});

	it("does not block deletion without a Polar subscription", () => {
		const overview = buildBillingOverview(null, { monthly: MONTHLY, yearly: YEARLY }, copy);
		expect(overview.deleteBlockedBySubscription).toBe(false);
	});

	it("does not block deletion when Polar already scheduled cancelAtPeriodEnd", () => {
		const overview = buildBillingOverview(
			polarSnapshot({ status: "active", cancelAtPeriodEnd: true }),
			{ monthly: MONTHLY, yearly: YEARLY },
			copy,
		);
		expect(overview.subscriptionStatus).toBe("canceled_at_period_end");
		expect(overview.deleteBlockedBySubscription).toBe(false);
	});

	it("does not block past_due that Polar already scheduled to cancel", () => {
		const overview = buildBillingOverview(
			polarSnapshot({ status: "past_due", cancelAtPeriodEnd: true }),
			{ monthly: MONTHLY, yearly: YEARLY },
			copy,
		);
		expect(overview.subscriptionStatus).toBe("free");
		expect(overview.cancelAtPeriodEnd).toBe(false);
		expect(overview.deleteBlockedBySubscription).toBe(false);
	});

	it("does not block deletion for a manual premium when Polar snapshot is null", () => {
		const overview = buildBillingOverview(null, { monthly: MONTHLY, yearly: YEARLY }, copy);
		expect(overview.subscriptionStatus).toBe("free");
		expect(overview.deleteBlockedBySubscription).toBe(false);
	});

	it("blocks deletion for an active Polar subscription that is not canceling", () => {
		const overview = buildBillingOverview(
			polarSnapshot({ status: "active" }),
			{ monthly: MONTHLY, yearly: YEARLY },
			copy,
		);
		expect(overview.subscriptionStatus).toBe("active");
		expect(overview.deleteBlockedBySubscription).toBe(true);
	});
});
