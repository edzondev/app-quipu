import { ENVELOPE_LABELS } from "@/shared/constants/envelopes";
import { formatCents } from "@/shared/lib/money";
import type { ExpenseEnvelopeType } from "./envelopeSuggestion";

type DailyImpactInput = {
  amountCents: number;
  envelopeType: ExpenseEnvelopeType;
  dailyDeltaCents: number;
  dailyAfterCents: number;
  daysRemainingInCycle: number;
};

/**
 * Línea de feedback post-gasto: hace visible cómo el gasto amortiza el
 * ritmo diario. Tres tonos: sin cambio (sobre ya en negativo), dentro del
 * ritmo (el gasto cabe en un día del nuevo ritmo) y gasto grande.
 */
export function buildDailyImpactLine(
  input: DailyImpactInput,
  currencyCode: string,
): string {
  const label = ENVELOPE_LABELS[input.envelopeType];
  // Intl inserta nbsp del locale; normalizamos a espacio simple para copy plano.
  const money = (cents: number) =>
    formatCents(cents, { currency: currencyCode }).replace(
      /[\u00a0\u202f]/g,
      " ",
    );

  if (input.dailyDeltaCents === 0) {
    return `Gastaste ${money(input.amountCents)} en ${label}. Tu ritmo diario no cambia.`;
  }

  const drop = money(Math.abs(input.dailyDeltaCents));
  const newRate = money(input.dailyAfterCents);

  if (input.amountCents <= input.dailyAfterCents) {
    return `Cabe en tu ritmo: baja ${drop} al día. Ahora son ≈ ${newRate}/día.`;
  }
  return `Tu ritmo diario baja ${drop} al día (quedan ${input.daysRemainingInCycle} días): ahora ≈ ${newRate}/día.`;
}
