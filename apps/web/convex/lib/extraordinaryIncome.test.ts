import { describe, expect, it } from "vitest";
import {
	canonicalExtraordinaryDescription,
	DEFAULT_EXTRAORDINARY_RULES,
	profileRuleToEventPolicy,
	sourceForExtraordinaryType,
	suggestedEventPolicyForType,
} from "./extraordinaryIncome";

describe("extraordinaryIncome", () => {
	it("maps CTS default rule to all_to_savings event policy", () => {
		expect(suggestedEventPolicyForType("cts", DEFAULT_EXTRAORDINARY_RULES)).toBe("all_to_savings");
	});

	it("maps gratification to profile_default", () => {
		expect(suggestedEventPolicyForType("gratification_july", DEFAULT_EXTRAORDINARY_RULES)).toBe(
			"profile_default",
		);
	});

	it("maps all_to_emergency_fund profile rule to all_to_savings", () => {
		expect(profileRuleToEventPolicy("all_to_emergency_fund")).toBe("all_to_savings");
	});

	it("uses payroll source except custom", () => {
		expect(sourceForExtraordinaryType("cts")).toBe("payroll");
		expect(sourceForExtraordinaryType("custom")).toBe("other");
	});

	it("builds canonical descriptions", () => {
		expect(canonicalExtraordinaryDescription("gratification_july")).toBe("Gratificación de julio");
		expect(canonicalExtraordinaryDescription("custom", " Premio ventas ")).toBe("Premio ventas");
	});
});
