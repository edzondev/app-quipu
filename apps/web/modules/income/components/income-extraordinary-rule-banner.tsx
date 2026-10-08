"use client";

import type { ExtraordinaryProfileRule } from "@/shared/lib/extraordinaryIncome";
import {
	type ExtraordinaryRules,
	type ExtraordinaryType,
	mergeExtraordinaryRules,
	resolveExtraordinaryRuleKey,
} from "@/shared/lib/extraordinaryIncome";
import { INCOME_EXTRAORDINARY_RULE_CHANGE, INCOME_EXTRAORDINARY_RULE_PREFIX } from "../constants";

type Props = {
	extraordinaryType: ExtraordinaryType;
	profileRules: Partial<ExtraordinaryRules> | undefined;
	allocationNeeds: number;
	allocationWants: number;
	allocationSavings: number;
	onChangeDestination: () => void;
};

function ruleGroupLabel(type: ExtraordinaryType): string {
	if (type === "gratification_july" || type === "gratification_december") {
		return "Gratificaciones";
	}
	if (type === "cts") return "CTS";
	if (type === "corporate_bonus") return "Bonos empresariales";
	if (type === "profit_sharing") return "Utilidades";
	return "Otros extraordinarios";
}

function ruleBodyCopy(
	rule: ExtraordinaryProfileRule,
	allocationNeeds: number,
	allocationWants: number,
	allocationSavings: number,
): string {
	switch (rule) {
		case "profile_default":
			return `Usan tu distribución habitual ${allocationNeeds} / ${allocationWants} / ${allocationSavings}.`;
		case "all_to_savings":
			return "Van por completo al ahorro.";
		case "all_to_emergency_fund":
			return "Van por completo al Fondo de emergencia.";
		case "ask_each_time":
			return "Quipu te preguntará el destino al registrar.";
	}
}

export function IncomeExtraordinaryRuleBanner({
	extraordinaryType,
	profileRules,
	allocationNeeds,
	allocationWants,
	allocationSavings,
	onChangeDestination,
}: Props) {
	const merged = mergeExtraordinaryRules(profileRules);
	const key = resolveExtraordinaryRuleKey(extraordinaryType);
	const rule = merged[key];

	return (
		<div className="flex items-start gap-3 rounded-[14px] border border-extraordinary-border bg-[linear-gradient(160deg,var(--extraordinary-banner-from),var(--extraordinary-banner-to)_75%)] px-[17px] py-[15px]">
			<span className="mt-0.5 flex size-[26px] shrink-0 items-center justify-center rounded-lg bg-extraordinary-a">
				<span className="size-[11px] rotate-45 rounded-sm border-2 border-canvas" aria-hidden />
			</span>
			<div className="min-w-0 flex-1">
				<p className="text-[13.5px] font-semibold text-extraordinary-rule-title">
					{INCOME_EXTRAORDINARY_RULE_PREFIX} · {ruleGroupLabel(extraordinaryType)}
				</p>
				<p className="mt-0.5 text-[12.5px] leading-snug text-extraordinary-rule-body">
					{ruleBodyCopy(rule, allocationNeeds, allocationWants, allocationSavings)}
				</p>
			</div>
			<button
				type="button"
				onClick={onChangeDestination}
				className="shrink-0 text-[12.5px] font-semibold text-extraordinary-b whitespace-nowrap"
			>
				{INCOME_EXTRAORDINARY_RULE_CHANGE}
			</button>
		</div>
	);
}
