import type { Doc } from "../_generated/dataModel";

export const OVER_BUDGET_BUFFER = 0.05;
export const WANTS_BURN_RATE_THRESHOLD = 0.6;
export const CYCLE_DAYS = { biweekly: 15, monthly: 30 } as const;
export const ENVELOPE_TYPES = ["needs", "wants", "savings"] as const;
export const SECOND_PAYDAY_FALLBACK = 15;

export type PayFrequency = keyof typeof CYCLE_DAYS;
export type EnvelopeType = (typeof ENVELOPE_TYPES)[number];

type EnvelopeCompliance = Pick<
  Doc<"envelopes">,
  "type" | "remainingAmount" | "allocatedAmount"
>;
type CommitmentShare = Pick<Doc<"fixedCommitments">, "frequency" | "amount">;
type AllocationWeights = Pick<
  Doc<"profiles">,
  "allocationNeeds" | "allocationWants" | "allocationSavings"
>;

// Rescate: cubre el déficit real de wants, topado por el saldo disponible en ahorros.
export function computeRescueTransfer(
  savingsRemaining: number,
  wantsRemaining: number,
): number {
  const deficit = wantsRemaining < 0 ? Math.abs(wantsRemaining) : 0;
  return Math.min(savingsRemaining, deficit);
}

// Alerta si quemó >60% de Gustos antes de pasar la mitad del ciclo (derivada del propio ciclo).
export function shouldWarnWantsBurn(p: {
  allocated: number;
  remaining: number;
  cycleStart: number;
  cycleEnd: number;
  now: number;
}): boolean {
  const { allocated, remaining, cycleStart, cycleEnd, now } = p;
  if (allocated <= 0) return false;
  const burnRate = (allocated - remaining) / allocated;
  return (
    burnRate > WANTS_BURN_RATE_THRESHOLD &&
    now - cycleStart < (cycleEnd - cycleStart) / 2
  );
}

export function evaluateCycleCompliance(
  envelopes: EnvelopeCompliance[],
): "compliant" | "warning" | "failed" {
  let hasWarning = false;
  for (const { type, remainingAmount, allocatedAmount } of envelopes) {
    if (type === "savings" || remainingAmount >= 0) continue;
    if (Math.abs(remainingAmount) > allocatedAmount * OVER_BUDGET_BUFFER)
      return "failed";
    hasWarning = true;
  }
  return hasWarning ? "warning" : "compliant";
}

export function sumApplicableCommitments(
  commitments: CommitmentShare[],
  payFrequency: PayFrequency,
  currentDay: number,
  paydays: number[],
): number {
  if (payFrequency === "monthly") {
    return commitments.reduce((acc, c) => acc + c.amount, 0);
  }

  const secondPayday = paydays[1] ?? SECOND_PAYDAY_FALLBACK;
  const isFirstQuincena = currentDay < secondPayday;

  return commitments.reduce((acc, { frequency, amount }) => {
    if (frequency === "every_payday") return acc + amount;
    if (frequency === "monthly") return acc + Math.round(amount / 2); // mitad por quincena, en céntimos enteros
    if (frequency === "first_payday" && isFirstQuincena) return acc + amount;
    if (frequency === "second_payday" && !isFirstQuincena) return acc + amount;
    return acc;
  }, 0);
}

// Reparto entero con largest-remainder: los céntimos sobrantes van a las mayores
// partes fraccionarias, garantizando que los 3 sobres sumen exacto el neto.
export function computeAllocations(
  netAvailableCents: number,
  weights: AllocationWeights,
): Record<EnvelopeType, number> {
  const w: Record<EnvelopeType, number> = {
    needs: weights.allocationNeeds,
    wants: weights.allocationWants,
    savings: weights.allocationSavings,
  };
  const total = w.needs + w.wants + w.savings;
  if (total <= 0)
    throw new Error("La distribución del perfil es inválida (suma 0).");

  const parts = ENVELOPE_TYPES.map((type) => {
    const exact = (netAvailableCents * w[type]) / total;
    const floor = Math.floor(exact);
    return { type, floor, frac: exact - floor };
  });

  const result: Record<EnvelopeType, number> = {
    needs: 0,
    wants: 0,
    savings: 0,
  };
  for (const p of parts) result[p.type] = p.floor;

  let remainder =
    netAvailableCents - parts.reduce((acc, p) => acc + p.floor, 0);
  const byFracDesc = [...parts].sort((a, b) => b.frac - a.frac);
  for (let i = 0; remainder > 0; i++, remainder--) {
    const part = byFracDesc[i % byFracDesc.length];
    if (part) result[part.type] += 1;
  }

  return result;
}

export function isValidAllocations(
  needs: number,
  wants: number,
  savings: number,
): boolean {
  return (
    [needs, wants, savings].every((n) => Number.isInteger(n) && n >= 0) &&
    needs + wants + savings === 100
  );
}

export function isValidPaydays(
  payFrequency: PayFrequency,
  paydays: number[],
): boolean {
  if (paydays.some((d) => !Number.isInteger(d) || d < 1 || d > 31))
    return false;
  return payFrequency === "biweekly"
    ? paydays.length >= 2
    : paydays.length >= 1;
}
