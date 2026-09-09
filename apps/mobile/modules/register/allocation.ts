import type {
  AllocationWeights,
  DistributionPolicy,
  EnvelopeAmounts,
  ExtraordinaryRules,
  ExtraordinaryType,
} from "./types";

const ENVELOPE_TYPES = ["needs", "wants", "savings"] as const;

const ENVELOPE_LABEL = {
  needs: "Necesidades",
  wants: "Gustos",
  savings: "Ahorro",
} as const;

function formatCentsShort(cents: number): string {
  const soles = cents / 100;
  const hasCents = cents % 100 !== 0;
  const formatted = soles.toLocaleString("es-PE", {
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: 2,
  });
  return `S/ ${formatted}`;
}

const DEFAULT_EXTRAORDINARY_RULES: ExtraordinaryRules = {
  cts: "all_to_emergency_fund",
  gratifications: "profile_default",
  corporate_bonus: "profile_default",
  profit_sharing: "profile_default",
  custom: "profile_default",
};

export function splitIncome(
  amountCents: number,
  weights: AllocationWeights,
  policy: DistributionPolicy,
): EnvelopeAmounts {
  if (policy === "all_to_savings") {
    return { needs: 0, wants: 0, savings: amountCents };
  }

  const w: EnvelopeAmounts = {
    needs: weights.allocationNeeds,
    wants: weights.allocationWants,
    savings: weights.allocationSavings,
  };
  const total = w.needs + w.wants + w.savings;
  if (total <= 0) {
    return { needs: 0, wants: 0, savings: amountCents };
  }

  const parts = ENVELOPE_TYPES.map((type) => {
    const exact = (amountCents * w[type]) / total;
    const floor = Math.floor(exact);
    return { type, floor, frac: exact - floor };
  });

  const result: EnvelopeAmounts = { needs: 0, wants: 0, savings: 0 };
  for (const part of parts) result[part.type] = part.floor;

  let remainder =
    amountCents - parts.reduce((acc, part) => acc + part.floor, 0);
  const byFracDesc = [...parts].sort((a, b) => b.frac - a.frac);
  for (let i = 0; remainder > 0; i++, remainder--) {
    const part = byFracDesc[i % byFracDesc.length];
    if (part) result[part.type] += 1;
  }

  return result;
}

export function previewIncomeSplit(input: {
  amountCents: number;
  weights: AllocationWeights;
  policy: DistributionPolicy;
  commitmentsRemainingCents: number;
}): {
  envelopes: Array<{
    type: (typeof ENVELOPE_TYPES)[number];
    label: string;
    percent: number;
    cents: number;
  }>;
  commitmentsNote: string | null;
} {
  const envelopes = splitIncome(input.amountCents, input.weights, input.policy);
  const percents: EnvelopeAmounts =
    input.policy === "all_to_savings"
      ? { needs: 0, wants: 0, savings: 100 }
      : {
          needs: input.weights.allocationNeeds,
          wants: input.weights.allocationWants,
          savings: input.weights.allocationSavings,
        };

  const commitmentsNote =
    input.commitmentsRemainingCents > 0
      ? `Tus compromisos del ciclo (${formatCentsShort(input.commitmentsRemainingCents)}) salen de Necesidades.`
      : null;

  return {
    envelopes: ENVELOPE_TYPES.map((type) => ({
      type,
      label: ENVELOPE_LABEL[type],
      percent: percents[type],
      cents: envelopes[type],
    })),
    commitmentsNote,
  };
}

function ruleKey(type: ExtraordinaryType): keyof ExtraordinaryRules {
  if (type === "gratification_july" || type === "gratification_december") {
    return "gratifications";
  }
  return type;
}

export function resolveExtraordinaryPolicy(
  type: ExtraordinaryType,
  rules: Partial<ExtraordinaryRules> | undefined,
): { policy: DistributionPolicy; askEachTime: boolean } {
  const merged = { ...DEFAULT_EXTRAORDINARY_RULES, ...rules };
  const rule = merged[ruleKey(type)];
  if (rule === "ask_each_time") {
    return { policy: "profile_default", askEachTime: true };
  }
  if (rule === "all_to_savings" || rule === "all_to_emergency_fund") {
    return { policy: "all_to_savings", askEachTime: false };
  }
  return { policy: "profile_default", askEachTime: false };
}
