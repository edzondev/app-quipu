import { EXPENSE_AMOUNT_MAX_CENTS } from "./draft";

/**
 * Keypad de registro: cada dígito desplaza céntimos (estilo POS).
 * La coma del canon es el separador visual; el monto siempre tiene dos decimales.
 */
export function appendKeypadDigit(currentCents: number, digit: number): number {
  if (!Number.isInteger(currentCents) || currentCents < 0) return 0;
  if (!Number.isInteger(digit) || digit < 0 || digit > 9) return currentCents;
  const next = currentCents * 10 + digit;
  return next > EXPENSE_AMOUNT_MAX_CENTS ? currentCents : next;
}

export function backspaceKeypad(currentCents: number): number {
  if (!Number.isInteger(currentCents) || currentCents <= 0) return 0;
  return Math.floor(currentCents / 10);
}

export function keypadFigures(cents: number): { major: string; minor: string } {
  const safe = Number.isInteger(cents) && cents >= 0 ? cents : 0;
  return {
    major: String(Math.floor(safe / 100)),
    minor: String(safe % 100).padStart(2, "0"),
  };
}

export function formatKeypadAmount(cents: number): string {
  const figures = keypadFigures(cents);
  return `${figures.major}.${figures.minor}`;
}
