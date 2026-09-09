import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import {
  appendKeypadDigit,
  backspaceKeypad,
  formatKeypadDisplay,
} from "@/modules/register/keypad";
import {
  formatRemainingLine,
  remainingAfterExpense,
} from "@/modules/register/remaining";
import type { ExpenseEnvelope } from "@/modules/register/types";
import { Backspace, Camera } from "@/shared/components/ui/reicon";

type Props = {
  todayCents: number | null;
  submitting?: boolean;
  error?: string | null;
  onCancel: () => void;
  onSubmit: (input: {
    amountCents: number;
    description: string;
    envelopeType: ExpenseEnvelope;
  }) => void;
  onIncome: () => void;
};

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ",", "0"] as const;

const PILL_ON: Record<ExpenseEnvelope, string> = {
  needs: "border-needs",
  wants: "border-wants",
};

const PILL_TEXT_ON: Record<ExpenseEnvelope, string> = {
  needs: "text-needs",
  wants: "text-wants",
};

export function ExpenseSheet({
  todayCents,
  submitting = false,
  error,
  onCancel,
  onSubmit,
  onIncome,
}: Props) {
  const [amountCents, setAmountCents] = useState(0);
  const [merchant, setMerchant] = useState("");
  const [envelope, setEnvelope] = useState<ExpenseEnvelope>("wants");
  const [attempted, setAttempted] = useState(false);

  const { intPart, decPart } = formatKeypadDisplay(amountCents);
  const remainingCents =
    todayCents == null ? null : remainingAfterExpense(todayCents, amountCents);

  const fieldError =
    attempted && todayCents == null
      ? "Primero registra un ingreso para abrir el ciclo."
      : attempted && amountCents <= 0
        ? "Escribe el monto del gasto."
        : error;

  const submit = () => {
    if (todayCents == null || amountCents <= 0) {
      setAttempted(true);
      return;
    }
    onSubmit({
      amountCents,
      description: merchant.trim(),
      envelopeType: envelope,
    });
  };

  return (
    <View className="flex-1">
      <View className="flex-row items-center justify-between">
        <Text className="font-geist-mono text-[10.5px] tracking-[0.18em] text-foreground/45 uppercase">
          NUEVO GASTO
        </Text>
        <Pressable onPress={onCancel} hitSlop={8} accessibilityRole="button">
          <Text className="font-hanken text-[15px] text-foreground/55">
            Cancelar
          </Text>
        </Pressable>
      </View>

      <View className="mt-5 flex-row items-baseline">
        <Text className="font-newsreader text-[28px] text-foreground/45">
          S/{" "}
        </Text>
        <Text
          testID="expense-int"
          className="font-newsreader text-[56px] leading-16 text-foreground"
        >
          {intPart}
        </Text>
        <Text
          testID="expense-dec"
          className="font-newsreader text-[24px] text-foreground/45"
        >
          .{decPart}
        </Text>
        <View className="ml-1 h-10 w-0.5 self-center bg-foreground" />
      </View>

      <View className="mt-4 flex-row items-center gap-3 border-b border-line pb-2">
        <TextInput
          testID="merchant-input"
          value={merchant}
          onChangeText={setMerchant}
          placeholder="¿Dónde fue?"
          placeholderTextColorClassName="accent-foreground/35"
          maxLength={120}
          className="flex-1 font-hanken text-[18px] text-foreground"
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cámara"
          hitSlop={8}
        >
          <Camera size={20} className="text-foreground/40" />
        </Pressable>
      </View>

      <View className="mt-4 flex-row gap-2">
        {(
          [
            ["needs", "Necesidades"],
            ["wants", "Gustos"],
          ] as const
        ).map(([type, label]) => {
          const selected = envelope === type;
          return (
            <Pressable
              key={type}
              testID={`envelope-${type}`}
              onPress={() => setEnvelope(type)}
              className={`rounded-full border px-4 py-2.5 ${
                selected ? PILL_ON[type] : "border-line"
              }`}
            >
              <Text
                className={`font-hanken-semibold text-[14px] ${
                  selected ? PILL_TEXT_ON[type] : "text-foreground/70"
                }`}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text className="mt-4 font-geist-mono text-[10.5px] tracking-[0.14em] text-foreground/40 uppercase">
        {remainingCents == null
          ? "El ciclo empieza con tu primer ingreso"
          : formatRemainingLine(remainingCents)}
      </Text>

      {fieldError ? (
        <Text className="mt-2 font-hanken text-[13px] text-danger">
          {fieldError}
        </Text>
      ) : null}

      <View className="mt-3">
        {([0, 1, 2, 3] as const).map((row) => (
          <View key={row} className="flex-row">
            {KEYS.slice(row * 3, row * 3 + 3).map((key) => (
              <Pressable
                key={key}
                testID={key === "," ? "keypad-comma" : `keypad-${key}`}
                onPress={() => {
                  if (key === ",") return;
                  setAmountCents((current) =>
                    appendKeypadDigit(current, Number(key)),
                  );
                }}
                className="h-16 flex-1 items-center justify-center"
              >
                <Text className="font-hanken text-[28px] text-foreground">
                  {key}
                </Text>
              </Pressable>
            ))}
            {row === 3 ? (
              <Pressable
                testID="keypad-backspace"
                onPress={() =>
                  setAmountCents((current) => backspaceKeypad(current))
                }
                className="h-16 flex-1 items-center justify-center"
                accessibilityLabel="Borrar"
              >
                <Backspace size={22} className="text-foreground" />
              </Pressable>
            ) : null}
          </View>
        ))}
      </View>

      <Pressable
        testID="submit-expense"
        accessibilityRole="button"
        onPress={submit}
        disabled={submitting}
        className="mt-2 h-14 items-center justify-center rounded-full bg-foreground"
      >
        <Text className="font-hanken-semibold text-[16px] text-background">
          Registrar gasto
        </Text>
      </Pressable>

      <Pressable
        testID="expense-to-income"
        onPress={onIncome}
        hitSlop={8}
        className="mt-3 items-center py-1"
      >
        <Text className="font-hanken text-[14px] text-foreground/45">
          Es un ingreso
        </Text>
      </Pressable>
    </View>
  );
}
