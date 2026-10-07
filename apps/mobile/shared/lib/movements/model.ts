export type EditableExpense = {
  id: string;
  amountCents: number;
  description: string;
  envelopeType: "needs" | "wants";
};

export type MovementSource = {
  id: string;
  kind: "expense" | "income" | "contribution";
  label: string;
  amount: number;
  envelopeLabel?: string;
  envelopeType?: "needs" | "wants" | "savings";
};

export type MovementRow = {
  id: string;
  kind: MovementSource["kind"];
  label: string;
  amountCents: number;
  direction: "out" | "in";
  tone: "needs" | "wants" | "savings" | "income";
  envelopeLabel?: string;
  editable: EditableExpense | null;
};

export function mapMovementRows(rows: MovementSource[]): MovementRow[] {
  return rows.map((row) => {
    const editable = editableExpense(row);
    return {
      id: row.id,
      kind: row.kind,
      label: row.label,
      amountCents: row.amount,
      direction: row.kind === "expense" ? "out" : "in",
      tone: rowTone(row),
      envelopeLabel: row.envelopeLabel,
      editable,
    };
  });
}

export type RecentExpense = {
  _id: string;
  amount: number;
  description: string;
  timestamp: number;
  envelopeType?: "needs" | "wants" | "savings";
};

export function readRecentExpenses(value: unknown): RecentExpense[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as Record<string, unknown>;
    if (typeof row._id !== "string" || typeof row.amount !== "number") {
      return [];
    }
    const envelopeType = row.envelopeType;
    return [
      {
        _id: row._id,
        amount: row.amount,
        description: typeof row.description === "string" ? row.description : "",
        timestamp: typeof row.timestamp === "number" ? row.timestamp : 0,
        envelopeType:
          envelopeType === "needs" ||
          envelopeType === "wants" ||
          envelopeType === "savings"
            ? envelopeType
            : undefined,
      },
    ];
  });
}

export function editableFromRecentExpense(expense: {
  _id: string;
  amount: number;
  description: string;
  envelopeType?: "needs" | "wants" | "savings";
}): EditableExpense | null {
  if (expense.envelopeType !== "needs" && expense.envelopeType !== "wants") {
    return null;
  }
  return {
    id: expense._id,
    amountCents: expense.amount,
    description: expense.description,
    envelopeType: expense.envelopeType,
  };
}

function editableExpense(row: MovementSource): EditableExpense | null {
  if (row.kind !== "expense") return null;
  if (row.envelopeType !== "needs" && row.envelopeType !== "wants") {
    return null;
  }
  return {
    id: row.id,
    amountCents: row.amount,
    description: row.label,
    envelopeType: row.envelopeType,
  };
}

const TONE_BY_LABEL = {
  Necesidades: "needs",
  Gustos: "wants",
  Ahorro: "savings",
} as const;

function rowTone(row: MovementSource): MovementRow["tone"] {
  if (row.kind !== "expense") return "income";
  if (
    row.envelopeType === "needs" ||
    row.envelopeType === "wants" ||
    row.envelopeType === "savings"
  ) {
    return row.envelopeType;
  }
  if (row.envelopeLabel && row.envelopeLabel in TONE_BY_LABEL) {
    return TONE_BY_LABEL[row.envelopeLabel as keyof typeof TONE_BY_LABEL];
  }
  return "income";
}
