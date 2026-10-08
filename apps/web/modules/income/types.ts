import type { FunctionReturnType } from "convex/server";
import type { api } from "@/convex/_generated/api";

export type IncomeSource =
	| "payroll"
	| "freelance"
	| "business"
	| "gift"
	| "refund"
	| "investment"
	| "other";

export type IncomeRegisterResult = FunctionReturnType<typeof api.incomeEvents.createIncomeEvent>;

export type IncomeFlowStep = "form" | "success";

export type IncomeFlowState = {
	step: IncomeFlowStep;
	amountCents: number;
	source: IncomeSource | null;
	concept: string;
	occurredAt: number;
	result?: IncomeRegisterResult;
};
