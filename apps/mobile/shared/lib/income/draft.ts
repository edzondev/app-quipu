import type { api } from "@quipu/convex-api";
import type { FunctionArgs } from "convex/server";
import { limaStartOfDay } from "@/shared/lib/lima-date";
import { getIncomeSourceLabel } from "../../../../../apps/web/shared/lib/incomeSource";

export type CreateIncomeEventArgs = FunctionArgs<typeof api.incomeEvents.createIncomeEvent>;

export type IncomeDraft = {
	amountCents: number;
	occurredAt: number;
};

export function defaultIncomeDraft(now = Date.now()): IncomeDraft {
	return { amountCents: 0, occurredAt: limaStartOfDay(now) };
}

export function toCreateIncomeEventArgs(draft: IncomeDraft): CreateIncomeEventArgs {
	return {
		amount: draft.amountCents,
		source: "payroll",
		description: getIncomeSourceLabel("payroll"),
		occurredAt: draft.occurredAt,
		incomeKind: "habitual",
	};
}
