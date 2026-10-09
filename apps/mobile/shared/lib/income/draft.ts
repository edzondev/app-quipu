import type { api } from "@quipu/convex-api";
import type { FunctionArgs } from "convex/server";
import { HABITUAL_INCOME_LABEL, HABITUAL_INCOME_SOURCE } from "@/shared/lib/income/source";
import { limaStartOfDay } from "@/shared/lib/lima-date";

export type CreateIncomeEventArgs = FunctionArgs<typeof api.incomeEvents.createIncomeEvent>;
export type IncomeKind = NonNullable<CreateIncomeEventArgs["incomeKind"]>;

export type IncomeDraft = {
	amountCents: number;
	occurredAt: number;
	incomeKind: IncomeKind;
};

export type IncomeRecord = Pick<CreateIncomeEventArgs, "source" | "description">;

/** Saldo de hoy del onboarding. `other` sale del union de `createIncomeEvent`. */
export const TODAY_BALANCE_RECORD = {
	source: "other",
	description: "Dinero de hoy",
} satisfies IncomeRecord;

export function defaultIncomeDraft(now = Date.now()): IncomeDraft {
	return { amountCents: 0, occurredAt: limaStartOfDay(now), incomeKind: "habitual" };
}

export function toCreateIncomeEventArgs(
	draft: IncomeDraft,
	record?: IncomeRecord,
): CreateIncomeEventArgs {
	return {
		amount: draft.amountCents,
		source: record?.source ?? HABITUAL_INCOME_SOURCE,
		description: record?.description ?? HABITUAL_INCOME_LABEL,
		occurredAt: draft.occurredAt,
		incomeKind: draft.incomeKind,
	};
}
