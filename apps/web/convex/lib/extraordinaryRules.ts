import type { DistributionPolicy } from "../../shared/lib/allocations";
import {
	type ExtraordinaryRules,
	type ExtraordinaryRulesAutoApply,
	type ExtraordinaryType,
	mergeExtraordinaryRulesAutoApply,
	resolveExtraordinaryRuleKey,
	suggestedEventPolicyForType,
} from "./extraordinaryIncome";

export type ResolveExtraordinaryPolicyInput = {
	isPremium: boolean;
	extraordinaryType: ExtraordinaryType;
	rules: Partial<ExtraordinaryRules> | undefined;
	autoApply: Partial<ExtraordinaryRulesAutoApply> | undefined;
	distributionPolicy: DistributionPolicy | undefined;
};

export type ResolveExtraordinaryPolicyResult =
	| {
			ok: true;
			distributionPolicy: DistributionPolicy;
			appliedByAutoRule: boolean;
	  }
	| {
			ok: false;
			reason: "confirmation_required";
	  };

export function isAutoApplyEnabledForType(
	isPremium: boolean,
	type: ExtraordinaryType,
	autoApply: Partial<ExtraordinaryRulesAutoApply> | undefined,
): boolean {
	if (!isPremium) return false;
	const merged = mergeExtraordinaryRulesAutoApply(autoApply);
	const key = resolveExtraordinaryRuleKey(type);
	return merged[key] === true;
}

export function canRuleAutoApply(
	type: ExtraordinaryType,
	rules: Partial<ExtraordinaryRules> | undefined,
): boolean {
	return suggestedEventPolicyForType(type, rules) !== "ask_each_time";
}

export function resolveExtraordinaryIncomePolicy(
	input: ResolveExtraordinaryPolicyInput,
): ResolveExtraordinaryPolicyResult {
	if (input.distributionPolicy) {
		return {
			ok: true,
			distributionPolicy: input.distributionPolicy,
			appliedByAutoRule: false,
		};
	}

	if (
		isAutoApplyEnabledForType(input.isPremium, input.extraordinaryType, input.autoApply) &&
		canRuleAutoApply(input.extraordinaryType, input.rules)
	) {
		const suggested = suggestedEventPolicyForType(input.extraordinaryType, input.rules);
		return {
			ok: true,
			distributionPolicy: suggested as DistributionPolicy,
			appliedByAutoRule: true,
		};
	}

	return { ok: false, reason: "confirmation_required" };
}
