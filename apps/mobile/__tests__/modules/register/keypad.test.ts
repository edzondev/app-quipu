import {
  appendKeypadDigit,
  backspaceKeypad,
  formatKeypadDisplay,
} from "@/modules/register/keypad";

function typeDigits(digits: number[]): number {
  return digits.reduce((cents, digit) => appendKeypadDigit(cents, digit), 0);
}

describe("appendKeypadDigit — estilo POS", () => {
  it("2, 5, 5, 0 es S/ 25.50, no 2550 soles", () => {
    const cents = typeDigits([2, 5, 5, 0]);
    expect(cents).toBe(2550);
    expect(formatKeypadDisplay(cents)).toEqual({
      intPart: "25",
      decPart: "50",
    });
  });

  it("cada dígito empuja los céntimos a la izquierda", () => {
    expect(appendKeypadDigit(0, 4)).toBe(4);
    expect(appendKeypadDigit(4, 2)).toBe(42);
    expect(appendKeypadDigit(42, 0)).toBe(420);
    expect(appendKeypadDigit(420, 0)).toBe(4200);
  });

  it("ignora dígitos fuera de 0-9", () => {
    expect(appendKeypadDigit(42, Number.NaN)).toBe(42);
    expect(appendKeypadDigit(42, 10)).toBe(42);
  });
});

describe("backspaceKeypad", () => {
  it("saca el último dígito", () => {
    expect(backspaceKeypad(2550)).toBe(255);
    expect(backspaceKeypad(4)).toBe(0);
    expect(backspaceKeypad(0)).toBe(0);
  });
});

describe("formatKeypadDisplay", () => {
  it("siempre muestra dos decimales", () => {
    expect(formatKeypadDisplay(0)).toEqual({ intPart: "0", decPart: "00" });
    expect(formatKeypadDisplay(42)).toEqual({ intPart: "0", decPart: "42" });
    expect(formatKeypadDisplay(4200)).toEqual({ intPart: "42", decPart: "00" });
    expect(formatKeypadDisplay(350_000)).toEqual({
      intPart: "3,500",
      decPart: "00",
    });
  });
});
