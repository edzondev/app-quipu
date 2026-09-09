export const CYCLE_DAYS_BY_FREQUENCY = {
  monthly: 30,
  biweekly: 15,
  weekly: 7,
  variable15: 15,
  variable30: 30,
} as const;

export function estimateDailyAvailable(input: {
  referenceIncomeCents: number;
  commitmentsTotalCents: number;
  allocationNeeds: number;
  allocationWants: number;
  allocationSavings: number;
  cycleDays: number;
}): number | null {
  const {
    referenceIncomeCents,
    commitmentsTotalCents,
    allocationSavings,
    cycleDays,
  } = input;
  if (!referenceIncomeCents || cycleDays <= 0) return null;
  const savingsCents = Math.floor(
    (referenceIncomeCents * allocationSavings) / 100,
  );
  const spendable = referenceIncomeCents - commitmentsTotalCents - savingsCents;
  if (spendable <= 0) return 0;
  return Math.floor(spendable / cycleDays);
}
