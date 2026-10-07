import {
  appendKeypadDigit,
  backspaceKeypad,
  formatKeypadAmount,
} from "@/shared/lib/expenses/keypad";

describe("expense keypad", () => {
  it("desplaza dígitos como céntimos", () => {
    let cents = 0;
    for (const digit of [4, 2, 0, 0]) cents = appendKeypadDigit(cents, digit);
    expect(cents).toBe(4200);
    expect(formatKeypadAmount(cents)).toBe("42.00");
  });

  it("ignora dígitos inválidos y el tope", () => {
    expect(appendKeypadDigit(10, 1.5)).toBe(10);
    expect(appendKeypadDigit(99_999_999, 1)).toBe(99_999_999);
  });

  it("borra un dígito", () => {
    expect(backspaceKeypad(4200)).toBe(420);
    expect(backspaceKeypad(0)).toBe(0);
  });
});
