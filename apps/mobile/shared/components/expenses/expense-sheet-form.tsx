import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { Camera } from "reicon-react-native/icons/Camera";
import type {
  ExpenseDraftInput,
  ExpenseField,
} from "@/shared/lib/expenses/draft";
import {
  formatKeypadAmount,
  keypadFigures,
} from "@/shared/lib/expenses/keypad";
import {
  remainingAfterExpense,
  sheetRemainingLabel,
} from "@/shared/lib/expenses/present";
import { EnvelopeChoices } from "./envelope-choices";
import { ExpenseKeypad } from "./expense-keypad";

const HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 };

type Props = {
  currencySymbol: string;
  dailyCents: number | null;
  fieldError?: { field: ExpenseField; message: string } | null;
  formError?: string | null;
  isSubmitting?: boolean;
  onSubmit: (input: ExpenseDraftInput) => void;
  onCancel: () => void;
  onOpenDetail: (input: ExpenseDraftInput) => void;
};

export function ExpenseSheetForm({
  currencySymbol,
  dailyCents,
  fieldError,
  formError,
  isSubmitting = false,
  onSubmit,
  onCancel,
  onOpenDetail,
}: Props) {
  const [amountCents, setAmountCents] = useState(0);
  const [description, setDescription] = useState("");
  const [envelopeType, setEnvelopeType] =
    useState<ExpenseDraftInput["envelopeType"]>(null);
  const figures = keypadFigures(amountCents);
  const remaining =
    dailyCents == null ? null : remainingAfterExpense(dailyCents, amountCents);

  function draft(): ExpenseDraftInput {
    return {
      amountRaw: formatKeypadAmount(amountCents),
      description,
      envelopeType,
    };
  }

  return (
    <KeyboardAwareScrollView
      keyboardShouldPersistTaps="handled"
      bottomOffset={24}
      contentContainerClassName="px-[22px] pb-8"
    >
      <View className="flex-row items-center justify-between">
        <Text className="font-geist-mono text-[10.5px] uppercase tracking-[0.14em] text-foreground/55">
          NUEVO GASTO
        </Text>
        <Pressable
          accessibilityRole="button"
          hitSlop={HIT_SLOP}
          onPress={onCancel}
        >
          <Text className="font-hanken-semibold text-[13px] text-foreground/45">
            Cancelar
          </Text>
        </Pressable>
      </View>

      <View className="mt-5 flex-row items-end gap-2">
        <Text className="mb-2 font-newsreader text-[22px] text-foreground/55">
          {currencySymbol}
        </Text>
        <Text
          accessibilityLabel="Monto"
          className="font-newsreader text-[56px] leading-[64px] tracking-tight text-foreground"
        >
          {`${figures.major}.${figures.minor}`}
        </Text>
        <View className="mb-2 h-11 w-0.5 rounded-sm bg-stable" />
      </View>
      {fieldError?.field === "amount" ? (
        <ErrorText message={fieldError.message} />
      ) : null}

      <View className="mt-5 flex-row items-center border-b border-line pb-3">
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Comercio"
          placeholderTextColor="#8C8880"
          maxLength={120}
          accessibilityLabel="Comercio"
          className="flex-1 font-hanken text-[16px] text-foreground"
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Abrir detalle del gasto"
          hitSlop={HIT_SLOP}
          onPress={() => onOpenDetail(draft())}
        >
          <Camera size={19} color="#9A968C" />
        </Pressable>
      </View>
      {fieldError?.field === "description" ? (
        <ErrorText message={fieldError.message} />
      ) : null}

      <View className="mt-3.5">
        <EnvelopeChoices
          value={envelopeType}
          disabled={isSubmitting}
          onChange={setEnvelopeType}
        />
      </View>
      {fieldError?.field === "envelopeType" ? (
        <ErrorText message={fieldError.message} />
      ) : null}

      {remaining == null ? null : (
        <Text className="mt-3.5 font-geist-mono text-[12.5px] uppercase text-foreground/45">
          {sheetRemainingLabel(remaining, currencySymbol)}
        </Text>
      )}

      <View className="mt-4">
        <ExpenseKeypad
          amountCents={amountCents}
          onAmountChange={setAmountCents}
        />
      </View>

      {formError ? <ErrorText message={formError} /> : null}
      <Pressable
        accessibilityRole="button"
        disabled={isSubmitting}
        onPress={() => onSubmit(draft())}
        className={`mt-2 items-center rounded-[13px] bg-foreground py-4 ${
          isSubmitting ? "opacity-60" : ""
        }`}
      >
        <Text className="font-hanken-semibold text-[15px] text-background">
          {isSubmitting ? "Guardando…" : "Registrar gasto"}
        </Text>
      </Pressable>
    </KeyboardAwareScrollView>
  );
}

function ErrorText({ message }: { message: string }) {
  return (
    <Text className="mt-2 font-hanken text-[13px] text-danger">{message}</Text>
  );
}
