const KEYPAD_MAX_CENTS = 99_999_999;

const INT_FORMATTER = new Intl.NumberFormat("es-PE", {
  maximumFractionDigits: 0,
});

export function appendKeypadDigit(currentCents: number, digit: number): number {
  if (!Number.isInteger(currentCents) || currentCents < 0) return 0;
  if (!Number.isInteger(digit) || digit < 0 || digit > 9) return currentCents;
  const next = currentCents * 10 + digit;
  return next > KEYPAD_MAX_CENTS ? currentCents : next;
}

export function backspaceKeypad(currentCents: number): number {
  if (!Number.isInteger(currentCents) || currentCents <= 0) return 0;
  return Math.floor(currentCents / 10);
}

export function formatKeypadDisplay(cents: number): {
  intPart: string;
  decPart: string;
} {
  const safe = Number.isInteger(cents) && cents >= 0 ? cents : 0;
  const whole = Math.floor(safe / 100);
  const rem = safe % 100;
  return {
    intPart: INT_FORMATTER.format(whole),
    decPart: rem.toString().padStart(2, "0"),
  };
}
