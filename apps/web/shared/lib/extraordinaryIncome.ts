import type { DistributionPolicy } from "./allocations";

export const EXTRAORDINARY_TYPES = [
	"gratification_july",
	"gratification_december",
	"cts",
	"corporate_bonus",
	"profit_sharing",
	"custom",
] as const;

export type ExtraordinaryType = (typeof EXTRAORDINARY_TYPES)[number];

export type ExtraordinaryProfileRule =
	| "all_to_emergency_fund"
	| "profile_default"
	| "all_to_savings"
	| "ask_each_time";

export type ExtraordinaryRules = {
	cts: ExtraordinaryProfileRule;
	gratifications: ExtraordinaryProfileRule;
	corporate_bonus: ExtraordinaryProfileRule;
	profit_sharing: ExtraordinaryProfileRule;
	custom: ExtraordinaryProfileRule;
};

export type ExtraordinaryRulesAutoApply = {
	cts: boolean;
	gratifications: boolean;
	corporate_bonus: boolean;
	profit_sharing: boolean;
	custom: boolean;
};

export const DEFAULT_EXTRAORDINARY_RULES: ExtraordinaryRules = {
	cts: "all_to_emergency_fund",
	gratifications: "profile_default",
	corporate_bonus: "profile_default",
	profit_sharing: "profile_default",
	custom: "profile_default",
};

export function mergeExtraordinaryRules(
	rules: Partial<ExtraordinaryRules> | undefined,
): ExtraordinaryRules {
	return { ...DEFAULT_EXTRAORDINARY_RULES, ...rules };
}

const DEFAULT_EXTRAORDINARY_RULES_AUTO_APPLY: ExtraordinaryRulesAutoApply = {
	cts: false,
	gratifications: false,
	corporate_bonus: false,
	profit_sharing: false,
	custom: false,
};

export function mergeExtraordinaryRulesAutoApply(
	autoApply: Partial<ExtraordinaryRulesAutoApply> | undefined,
): ExtraordinaryRulesAutoApply {
	return { ...DEFAULT_EXTRAORDINARY_RULES_AUTO_APPLY, ...autoApply };
}

export function resolveExtraordinaryRuleKey(type: ExtraordinaryType): keyof ExtraordinaryRules {
	switch (type) {
		case "gratification_july":
		case "gratification_december":
			return "gratifications";
		case "cts":
			return "cts";
		case "corporate_bonus":
			return "corporate_bonus";
		case "profit_sharing":
			return "profit_sharing";
		case "custom":
			return "custom";
	}
}

export function profileRuleToEventPolicy(
	rule: ExtraordinaryProfileRule,
): DistributionPolicy | "ask_each_time" {
	if (rule === "ask_each_time") return "ask_each_time";
	if (rule === "all_to_savings" || rule === "all_to_emergency_fund") {
		return "all_to_savings";
	}
	return "profile_default";
}

export function suggestedEventPolicyForType(
	type: ExtraordinaryType,
	rules: Partial<ExtraordinaryRules> | undefined,
): DistributionPolicy | "ask_each_time" {
	const merged = mergeExtraordinaryRules(rules);
	const key = resolveExtraordinaryRuleKey(type);
	return profileRuleToEventPolicy(merged[key]);
}

export function canonicalExtraordinaryDescription(
	type: ExtraordinaryType,
	customLabel?: string,
): string {
	switch (type) {
		case "gratification_july":
			return "Gratificación de julio";
		case "gratification_december":
			return "Gratificación de diciembre";
		case "cts":
			return "Compensación por tiempo de servicios (CTS)";
		case "corporate_bonus":
			return "Bono corporativo";
		case "profit_sharing":
			return "Utilidades";
		case "custom": {
			const label = customLabel?.trim();
			if (!label) {
				throw new Error("Extraordinary custom label required");
			}
			return label;
		}
	}
}

export function sourceForExtraordinaryType(type: ExtraordinaryType): "payroll" | "other" {
	return type === "custom" ? "other" : "payroll";
}

export function extraordinaryTypeLabel(type: ExtraordinaryType): string {
	switch (type) {
		case "gratification_july":
			return "Grati. julio";
		case "gratification_december":
			return "Grati. diciembre";
		case "cts":
			return "CTS";
		case "corporate_bonus":
			return "Bono corp.";
		case "profit_sharing":
			return "Utilidades";
		case "custom":
			return "Otro";
	}
}

export function extraordinaryProfileRuleLabel(rule: ExtraordinaryProfileRule): string {
	switch (rule) {
		case "all_to_emergency_fund":
			return "Todo al Fondo de emergencia";
		case "all_to_savings":
			return "Todo al ahorro";
		case "profile_default":
			return "Mi distribución habitual";
		case "ask_each_time":
			return "Preguntar cada vez";
	}
}
