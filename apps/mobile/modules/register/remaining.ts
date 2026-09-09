export function remainingAfterExpense(
  todayCents: number,
  expenseCents: number,
): number {
  return todayCents - expenseCents;
}

export function formatRemainingLine(remainingCents: number): string {
  const sign = remainingCents < 0 ? "-" : "";
  const abs = Math.abs(remainingCents);
  const whole = Math.floor(abs / 100);
  const dec = (abs % 100).toString().padStart(2, "0");
  return `DESPUÉS DE ESTE GASTO · HOY QUEDA S/ ${sign}${whole}.${dec}`;
}
