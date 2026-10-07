import { parseAmountToCents } from "./amount";

export const EXPENSE_DESCRIPTION_MAX = 120;
/** Mismo tope que el keypad de la web. */
export const EXPENSE_AMOUNT_MAX_CENTS = 99_999_999;

export type ExpenseEnvelope = "needs" | "wants";

export type ExpenseDraftInput = {
  amountRaw: string;
  description: string;
  envelopeType: ExpenseEnvelope | "savings" | null;
};

export type ExpenseDraft = {
  amount: number;
  description: string;
  envelopeType: ExpenseEnvelope;
};

export type ExpenseField = "amount" | "description" | "envelopeType";

export type ExpenseDraftFailure = {
  ok: false;
  error: { field: ExpenseField; message: string };
};

export type ExpenseDraftResult =
  | { ok: true; value: ExpenseDraft }
  | ExpenseDraftFailure;

export class ExpenseValidationError extends Error {
  readonly field: ExpenseField;

  constructor(error: { field: ExpenseField; message: string }) {
    super(error.message);
    this.name = "ExpenseValidationError";
    this.field = error.field;
  }
}

export function validateExpenseDraft(
  input: ExpenseDraftInput,
): ExpenseDraftResult {
  const amount = parseAmountToCents(input.amountRaw);
  if (amount == null || amount <= 0) {
    return {
      ok: false,
      error: { field: "amount", message: "Ingresa un monto mayor a cero." },
    };
  }
  if (amount > EXPENSE_AMOUNT_MAX_CENTS) {
    return {
      ok: false,
      error: {
        field: "amount",
        message: "El monto supera el máximo permitido para registrar.",
      },
    };
  }

  const description = input.description.trim();
  if (description.length > EXPENSE_DESCRIPTION_MAX) {
    return {
      ok: false,
      error: {
        field: "description",
        message: "La descripción no puede superar 120 caracteres.",
      },
    };
  }

  if (input.envelopeType === "savings") {
    return {
      ok: false,
      error: {
        field: "envelopeType",
        message: "El ahorro no es un gasto. Elige Necesidades o Gustos.",
      },
    };
  }
  if (input.envelopeType !== "needs" && input.envelopeType !== "wants") {
    return {
      ok: false,
      error: {
        field: "envelopeType",
        message: "Elige un sobre para el gasto.",
      },
    };
  }

  return {
    ok: true,
    value: { amount, description, envelopeType: input.envelopeType },
  };
}
