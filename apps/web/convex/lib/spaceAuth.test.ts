import { describe, expect, it } from "vitest";
import {
	assertCurrencyCompatible,
	canReactivateSpace,
	hasMemberCapacity,
	isSpaceWritable,
	shouldTransitionSpaceToReadonly,
} from "./spaceAuthLogic";

describe("spaceAuth logic", () => {
	it("blocks accept when onboarded invitee has different currency", () => {
		const result = assertCurrencyCompatible(
			{ onboardingComplete: true, currencyCode: "USD" },
			{ currencyCode: "PEN" },
		);
		expect(result).toEqual({ ok: false, reason: "CURRENCY_MISMATCH" });
	});

	it("allows stub profile or matching currency", () => {
		expect(
			assertCurrencyCompatible(
				{ onboardingComplete: false, currencyCode: "USD" },
				{ currencyCode: "PEN" },
			),
		).toEqual({ ok: true });
		expect(
			assertCurrencyCompatible(
				{ onboardingComplete: true, currencyCode: "PEN" },
				{ currencyCode: "PEN" },
			),
		).toEqual({ ok: true });
	});

	it("writable only when space active and owner premium", () => {
		expect(isSpaceWritable({ status: "active" }, { plan: "premium" })).toBe(true);
		expect(isSpaceWritable({ status: "readonly" }, { plan: "premium" })).toBe(false);
		expect(isSpaceWritable({ status: "active" }, { plan: "free" })).toBe(false);
	});

	it("transitions to readonly when owner loses premium", () => {
		expect(shouldTransitionSpaceToReadonly({ status: "active" }, { plan: "free" })).toBe(true);
		expect(shouldTransitionSpaceToReadonly({ status: "closed" }, { plan: "free" })).toBe(false);
	});

	it("reactivates readonly space when premium returns", () => {
		expect(canReactivateSpace({ status: "readonly" }, { plan: "premium" })).toBe(true);
		expect(canReactivateSpace({ status: "closed" }, { plan: "premium" })).toBe(false);
	});

	it("caps couple mode at two active members", () => {
		expect(hasMemberCapacity(0)).toBe(true);
		expect(hasMemberCapacity(1)).toBe(true);
		expect(hasMemberCapacity(2)).toBe(false);
	});
});
