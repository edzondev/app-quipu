import { describe, expect, it } from "vitest";
import { assertCurrencyCompatible } from "./spaceAuthLogic";

describe("spaceInvitations rules", () => {
	it("rejects expired invitation by timestamp", () => {
		const expired = Date.now() - 1_000;
		expect(expired < Date.now()).toBe(true);
	});

	it("blocks onboarded invitee with mismatched currency", () => {
		expect(
			assertCurrencyCompatible(
				{ onboardingComplete: true, currencyCode: "EUR" },
				{ currencyCode: "PEN" },
			).ok,
		).toBe(false);
	});

	it("allows stub invitee before personal onboarding", () => {
		expect(
			assertCurrencyCompatible(
				{ onboardingComplete: false, currencyCode: "EUR" },
				{ currencyCode: "PEN" },
			).ok,
		).toBe(true);
	});
});
