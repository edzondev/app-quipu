import { describe, expect, it } from "vitest";
import { buildBillingOverview, isPremiumPolarSubscription, resolvePlanTier } from "./billingSync";

const MONTHLY = "prod_monthly";
const YEARLY = "prod_yearly";
const copy = {
	freeBody: "Gratis",
	renewalPrefix: "Próxima renovación",
	renewalAutomatic: "Renovación automática",
	canceledUntil: "Cancelado · activo hasta",
};

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
});
