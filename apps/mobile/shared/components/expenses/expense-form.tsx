import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { centsToAmountRaw } from "@/shared/lib/expenses/amount";
import type {
  ExpenseDraftInput,
  ExpenseField,
} from "@/shared/lib/expenses/draft";

type InitialExpense = {
  amountCents: number;
  description: string;
  envelopeType: "needs" | "wants";
};

type Props = {
  initial?: InitialExpense;
  submitLabel: string;
  fieldError?: { field: ExpenseField; message: string } | null;
  formError?: string | null;
  isSubmitting?: boolean;
  onSubmit: (input: ExpenseDraftInput) => void;
  onDelete?: () => void;
};

const ENVELOPES = [
  { type: "needs", label: "Necesidades" },
  { type: "wants", label: "Gustos" },
] as const;

export function ExpenseForm({
  initial,
  submitLabel,
  fieldError,
  formError,
  isSubmitting = false,
  onSubmit,
  onDelete,
}: Props) {
  const [amountRaw, setAmountRaw] = useState(() =>
    initial ? centsToAmountRaw(initial.amountCents) : "",
  );
  const [description, setDescription] = useState(initial?.description ?? "");
  const [envelopeType, setEnvelopeType] = useState<"needs" | "wants" | null>(
    initial?.envelopeType ?? null,
  );

  return (
    <View className="gap-4">
      <TextInput
        value={amountRaw}
        onChangeText={setAmountRaw}
        placeholder="0.00"
        keyboardType="decimal-pad"
        className="font-newsreader text-[40px] text-foreground"
      />
      <TextInput
        value={description}
        onChangeText={setDescription}
        placeholder="Descripción"
        maxLength={120}
        className="border-b border-line pb-2 font-hanken text-[16px] text-foreground"
      />
      <View className="flex-row gap-2">
        {ENVELOPES.map((option) => {
          const selected = envelopeType === option.type;
          return (
            <Pressable
              key={option.type}
              accessibilityRole="button"
              onPress={() => setEnvelopeType(option.type)}
              className={`rounded-full px-3 py-2 ${selected ? "bg-foreground" : "bg-foreground/10"}`}
            >
              <Text
                className={`font-hanken-semibold text-[14px] ${selected ? "text-background" : "text-foreground"}`}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {fieldError ? (
        <Text className="font-hanken text-[13px] text-danger">
          {fieldError.message}
        </Text>
      ) : null}
      {formError ? (
        <Text className="font-hanken text-[13px] text-danger">{formError}</Text>
      ) : null}
      <Pressable
        accessibilityRole="button"
        disabled={isSubmitting}
        onPress={() => onSubmit({ amountRaw, description, envelopeType })}
      >
        <Text className="font-hanken-semibold text-[15px] text-stable">
          {isSubmitting ? "Guardando…" : submitLabel}
        </Text>
      </Pressable>
      {onDelete ? (
        <Pressable accessibilityRole="button" onPress={onDelete}>
          <Text className="font-hanken-semibold text-[15px] text-danger">
            Eliminar
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
