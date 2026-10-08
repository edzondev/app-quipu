import type { FunctionReturnType } from "convex/server";
import type { api } from "@/convex/_generated/api";
import type { SurplusFromEnvelope } from "./schemas";

export type SavingsOverview = NonNullable<FunctionReturnType<typeof api.savings.getOverview>>;

export type SavingsEmergencyFund = NonNullable<SavingsOverview["emergencyFund"]>;

export type SavingsGoal = SavingsOverview["goals"][number];

export type EmergencyFundDetail = NonNullable<
	FunctionReturnType<typeof api.savings.getEmergencyFundDetail>
>;

export type CycleSavingsBreakdown = NonNullable<
	FunctionReturnType<typeof api.savings.getCycleSavingsBreakdown>
>;

export type MoveSurplusContext = NonNullable<
	FunctionReturnType<typeof api.savings.getMoveSurplusContext>
>;

export type SurplusFromSource = SurplusFromEnvelope;
