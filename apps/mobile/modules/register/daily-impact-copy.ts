import type { ExpenseEnvelope } from "./types";

const ENVELOPE_LABEL: Record<ExpenseEnvelope, string> = {
  needs: "Necesidades",
  wants: "Gustos",
};

type DailyImpactInput = {
  amountCents: number;
  envelopeType: ExpenseEnvelope;
  dailyDeltaCents: number;
  dailyAfterCents: number;
  daysRemainingInCycle: number;
};

/**
 * Línea de feedback post-gasto (misma lógica que web/modules/expenses):
 * sin cambio (sobre ya en negativo), dentro del ritmo, o gasto grande
 * amortizado entre los días restantes.
 */
export function buildDailyImpactLine(
  input: DailyImpactInput,
  formatMoney: (cents: number) => string,
): string {
  const label = ENVELOPE_LABEL[input.envelopeType];

  if (input.dailyDeltaCents === 0) {
    return `Gastaste ${formatMoney(input.amountCents)} en ${label}. Tu ritmo diario no cambia.`;
  }

  const drop = formatMoney(Math.abs(input.dailyDeltaCents));
  const newRate = formatMoney(input.dailyAfterCents);

  if (input.amountCents <= input.dailyAfterCents) {
    return `Cabe en tu ritmo: baja ${drop} al día. Ahora son ≈ ${newRate}/día.`;
  }
  return `Tu ritmo diario baja ${drop} al día (quedan ${input.daysRemainingInCycle} días): ahora ≈ ${newRate}/día.`;
}

export function formatSoles(cents: number): string {
  return `S/ ${(cents / 100).toLocaleString("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
