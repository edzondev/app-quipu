import { describe, expect, it } from "vitest";
import {
	canRuleAutoApply,
	isAutoApplyEnabledForType,
	resolveExtraordinaryIncomePolicy,
} from "./extraordinaryRules";

describe("isAutoApplyEnabledForType", () => {
	it("returns true for premium with autoApply enabled on CTS", () => {
		expect(isAutoApplyEnabledForType(true, "cts", { cts: true })).toBe(true);
	});

	it("returns false for free users even when autoApply is enabled", () => {
		expect(isAutoApplyEnabledForType(false, "cts", { cts: true })).toBe(false);
	});
});

describe("canRuleAutoApply", () => {
	it("returns false when rule is ask_each_time", () => {
		expect(canRuleAutoApply("custom", { custom: "ask_each_time" })).toBe(false);
	});

	it("returns true when rule has a concrete policy", () => {
		expect(canRuleAutoApply("cts", { cts: "all_to_emergency_fund" })).toBe(true);
	});
});

describe("resolveExtraordinaryIncomePolicy", () => {
	it("auto-applies for premium + autoApply + concrete rule", () => {
		const result = resolveExtraordinaryIncomePolicy({
			isPremium: true,
			extraordinaryType: "cts",
			rules: { cts: "all_to_emergency_fund" },
			autoApply: { cts: true },
			distributionPolicy: undefined,
		});

		expect(result).toEqual({
			ok: true,
			distributionPolicy: "all_to_savings",
			appliedByAutoRule: true,
		});
	});

	it("falls back to confirmation when premium has autoApply but ask_each_time rule", () => {
		const result = resolveExtraordinaryIncomePolicy({
			isPremium: true,
			extraordinaryType: "custom",
			rules: { custom: "ask_each_time" },
			autoApply: { custom: true },
			distributionPolicy: undefined,
		});

		expect(result).toEqual({ ok: false, reason: "confirmation_required" });
	});

	it("ignores autoApply for free users", () => {
		const result = resolveExtraordinaryIncomePolicy({
			isPremium: false,
			extraordinaryType: "cts",
			rules: { cts: "all_to_emergency_fund" },
			autoApply: { cts: true },
			distributionPolicy: undefined,
		});

		expect(result).toEqual({ ok: false, reason: "confirmation_required" });
	});

	it("uses explicit distributionPolicy without marking auto-applied", () => {
		const result = resolveExtraordinaryIncomePolicy({
			isPremium: true,
			extraordinaryType: "cts",
			rules: { cts: "all_to_emergency_fund" },
			autoApply: { cts: true },
			distributionPolicy: "profile_default",
		});

		expect(result).toEqual({
			ok: true,
			distributionPolicy: "profile_default",
			appliedByAutoRule: false,
		});
	});
});
