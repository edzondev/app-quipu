/**
 * Pure client-side calculation functions for Quipu budget envelopes.
 *
 * Logic is identical to what was previously computed server-side in
 * convex/helpers.ts and convex/specialIncomes.ts. Centralised here so
 * the server never needs to store or receive monthlyIncome.
 */

/**
 * Computes net spendable income after deducting fixed commitments.
 * Mirrors the formula from convex/helpers.ts (dependent worker path).
 */
export function calcularNetIncome(
  monthlyIncome: number,
  fixedNeeds: number,
  fixedWants: number,
): number {
  return monthlyIncome - (fixedNeeds + fixedWants);
}

/**
 * Splits a net income amount across the three envelopes using
 * percentage allocations (0-100 each, must sum to 100).
 * Mirrors convex/helpers.ts lines 142-144.
 */
export function calcularSplit(
  netIncome: number,
  allocations: { needs: number; wants: number; savings: number },
): { needs: number; wants: number; savings: number } {
  return {
    needs: netIncome * (allocations.needs / 100),
    wants: netIncome * (allocations.wants / 100),
    savings: netIncome * (allocations.savings / 100),
  };
}

/**
 * Returns the threshold above which an income is considered extraordinary.
 * Mirrors convex/specialIncomes.ts — default multiplier is 1.5.
 */
export function calcularThresholdExtraordinario(
  monthlyIncome: number,
  multiplier = 1.5,
): number {
  return monthlyIncome * multiplier;
}
