import { describe, expect, it } from "vitest";
import { polarSubscriptionBlocksDeletion } from "./polarDeletionGate";

describe("polarSubscriptionBlocksDeletion", () => {
	it("allows deletion when there is no subscription", () => {
		expect(polarSubscriptionBlocksDeletion(null)).toBe(false);
	});

	it("allows deletion when Polar already canceled or revoked", () => {
		expect(polarSubscriptionBlocksDeletion({ status: "canceled", cancelAtPeriodEnd: false })).toBe(
			false,
		);
		expect(polarSubscriptionBlocksDeletion({ status: "revoked", cancelAtPeriodEnd: false })).toBe(
			false,
		);
	});

	it("allows deletion when cancelAtPeriodEnd is true even if status is still billable", () => {
		expect(polarSubscriptionBlocksDeletion({ status: "active", cancelAtPeriodEnd: true })).toBe(
			false,
		);
		expect(polarSubscriptionBlocksDeletion({ status: "trialing", cancelAtPeriodEnd: true })).toBe(
			false,
		);
		expect(polarSubscriptionBlocksDeletion({ status: "past_due", cancelAtPeriodEnd: true })).toBe(
			false,
		);
	});

	it("blocks deletion for billable statuses that are not scheduled to cancel", () => {
		expect(polarSubscriptionBlocksDeletion({ status: "active", cancelAtPeriodEnd: false })).toBe(
			true,
		);
		expect(polarSubscriptionBlocksDeletion({ status: "trialing", cancelAtPeriodEnd: false })).toBe(
			true,
		);
		expect(polarSubscriptionBlocksDeletion({ status: "past_due", cancelAtPeriodEnd: false })).toBe(
			true,
		);
		expect(polarSubscriptionBlocksDeletion({ status: "unpaid", cancelAtPeriodEnd: false })).toBe(
			true,
		);
	});
});
