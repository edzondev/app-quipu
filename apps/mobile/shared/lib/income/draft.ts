import type { api } from "@quipu/convex-api";
import type { FunctionArgs } from "convex/server";
import { limaStartOfDay } from "@/shared/lib/lima-date";

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
		source: "other",
		description: "Ingreso",
		occurredAt: draft.occurredAt,
		incomeKind: "habitual",
	};
}
