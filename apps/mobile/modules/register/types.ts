export type ExpenseEnvelope = "needs" | "wants";

export type IncomeKind = "habitual" | "extraordinary";

export type IncomeSource =
  | "payroll"
  | "freelance"
  | "business"
  | "gift"
  | "refund"
  | "investment"
  | "other";

export type ExtraordinaryType =
  | "gratification_july"
  | "gratification_december"
  | "cts"
  | "corporate_bonus"
  | "profit_sharing"
  | "custom";

export type DistributionPolicy = "profile_default" | "all_to_savings";

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

export type AllocationWeights = {
  allocationNeeds: number;
  allocationWants: number;
  allocationSavings: number;
};

export type EnvelopeAmounts = {
  needs: number;
  wants: number;
  savings: number;
};

export type AllocationPlan = {
  reservations: Array<{ commitmentId: string; amountCents: number }>;
  envelopes: EnvelopeAmounts;
  savingsContributions: Array<{
    amountCents: number;
    kind: "objective" | "additional";
    subEnvelopeId?: string;
  }>;
  leaveUnallocatedCents: number;
};
