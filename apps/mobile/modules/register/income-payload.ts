import { splitIncome } from "./allocation";
import type {
  AllocationPlan,
  AllocationWeights,
  DistributionPolicy,
  ExtraordinaryType,
  IncomeKind,
  IncomeSource,
} from "./types";

const SOURCE_LABEL: Record<IncomeSource, string> = {
  payroll: "Sueldo",
  freelance: "Proyecto",
  business: "Negocio",
  gift: "Regalo",
  refund: "Devolución",
  investment: "Inversión",
  other: "Otro",
};

export type IncomeEventArgs = {
  amount: number;
  source: IncomeSource;
  description: string;
  occurredAt: number;
  incomeKind: IncomeKind;
  extraordinaryType?: ExtraordinaryType;
  extraordinaryLabel?: string;
  distributionPolicy?: DistributionPolicy;
  allocation: AllocationPlan;
};

export function buildIncomeEventArgs(input: {
  amountCents: number;
  kind: IncomeKind;
  source?: IncomeSource;
  extraordinaryType?: ExtraordinaryType;
  extraordinaryLabel?: string;
  weights: AllocationWeights;
  occurredAt: number;
  policy?: DistributionPolicy;
}): IncomeEventArgs {
  const policy = input.policy ?? "profile_default";
  const allocation: AllocationPlan = {
    reservations: [],
    envelopes: splitIncome(input.amountCents, input.weights, policy),
    savingsContributions: [],
    leaveUnallocatedCents: 0,
  };

  if (input.kind === "extraordinary") {
    const type = input.extraordinaryType;
    const source: IncomeSource = type === "custom" ? "other" : "payroll";
    return {
      amount: input.amountCents,
      source,
      description: "",
      occurredAt: input.occurredAt,
      incomeKind: "extraordinary",
      extraordinaryType: type,
      ...(type === "custom" && input.extraordinaryLabel
        ? { extraordinaryLabel: input.extraordinaryLabel }
        : {}),
      distributionPolicy: policy,
      allocation,
    };
  }

  const source = input.source ?? "payroll";
  return {
    amount: input.amountCents,
    source,
    description: SOURCE_LABEL[source],
    occurredAt: input.occurredAt,
    incomeKind: "habitual",
    allocation,
  };
}
