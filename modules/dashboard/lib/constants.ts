export const BADGE_CLASS: Record<string, string> = {
  needs: "bg-envelope-needs/15 text-envelope-needs border-0",
  wants: "bg-envelope-wants/15 text-envelope-wants border-0",
  juntos: "bg-envelope-juntos/15 text-envelope-juntos border-0",
};

export const ENVELOPE_LABEL: Record<string, string> = {
  needs: "Necesidades",
  wants: "Gustos",
  juntos: "Juntos",
};

/**
 * Formats a numeric amount with a currency symbol.
 * Negative values are rendered as `-${symbol} ${abs}`.
 */
export function fmt(value: number, symbol: string): string {
  const abs = Math.abs(value);
  const str = Number.isInteger(abs) ? abs.toString() : abs.toFixed(2);
  return value < 0 ? `-${symbol} ${str}` : `${symbol} ${str}`;
}
