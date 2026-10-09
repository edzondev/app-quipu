import type { api } from "@quipu/convex-api";
import type { FunctionArgs } from "convex/server";
import { HABITUAL_INCOME_LABEL, HABITUAL_INCOME_SOURCE } from "@/shared/lib/income/source";
import { limaStartOfDay } from "@/shared/lib/lima-date";

export type CreateIncomeEventArgs = FunctionArgs<typeof api.incomeEvents.createIncomeEvent>;
export type IncomeKind = NonNullable<CreateIncomeEventArgs["incomeKind"]>;
type ExtraordinaryType = NonNullable<CreateIncomeEventArgs["extraordinaryType"]>;
type DistributionPolicy = NonNullable<CreateIncomeEventArgs["distributionPolicy"]>;

/** La web no preselecciona tipo; este literal es el del validator de createIncomeEvent. */
const EXTRA_TYPE = "custom" satisfies ExtraordinaryType;
const EXTRA_LABEL = "Extra";
/** Opción recomendada del diálogo de destino y fallback de submit en la web. */
const EXTRA_POLICY = "profile_default" satisfies DistributionPolicy;

export type IncomeDraft = {
	amountCents: number;
	occurredAt: number;
	incomeKind: IncomeKind;
};

export function defaultIncomeDraft(now = Date.now()): IncomeDraft {
	return { amountCents: 0, occurredAt: limaStartOfDay(now), incomeKind: "habitual" };
}

export function toCreateIncomeEventArgs(draft: IncomeDraft): CreateIncomeEventArgs {
	const base = {
		amount: draft.amountCents,
		source: HABITUAL_INCOME_SOURCE,
		description: HABITUAL_INCOME_LABEL,
		occurredAt: draft.occurredAt,
		incomeKind: draft.incomeKind,
	} satisfies CreateIncomeEventArgs;
	if (draft.incomeKind !== "extraordinary") return base;
	return {
		...base,
		extraordinaryType: EXTRA_TYPE,
		extraordinaryLabel: EXTRA_LABEL,
		distributionPolicy: EXTRA_POLICY,
	};
}
