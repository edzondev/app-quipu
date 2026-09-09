import { Pressable, Text, View } from "react-native";
import {
  buildDailyImpactLine,
  formatSoles,
} from "@/modules/register/daily-impact-copy";
import type { ExpenseRegisterOutcome } from "@/modules/register/use-register-expense";
import { Money } from "@/shared/components/money/money";

type Props = {
  result: ExpenseRegisterOutcome;
  onDone: () => void;
};

export function ExpenseSuccess({ result, onDone }: Props) {
  const impactLine = buildDailyImpactLine(
    {
      amountCents: result.amount,
      envelopeType: result.envelopeType,
      dailyDeltaCents: result.dailyDeltaCents,
      dailyAfterCents: result.dailyAfterCents,
      daysRemainingInCycle: result.daysRemainingInCycle,
    },
    formatSoles,
  );
  const envelopeLabel =
    result.envelopeType === "wants" ? "Gustos" : "Necesidades";

  return (
    <View className="flex-1">
      <Text className="font-geist-mono text-[10.5px] tracking-[0.18em] text-foreground/45 uppercase">
        GASTO REGISTRADO
      </Text>

      <View className="mt-5">
        <Money cents={result.amount} size="hero" alwaysDecimals />
      </View>

      <Text className="mt-2 font-hanken text-[14px] text-foreground/55">
        Salió de{" "}
        <Text className="font-hanken-semibold text-foreground">
          {envelopeLabel}
        </Text>
        .
      </Text>

      <View className="mt-4 rounded-2xl border border-line px-4 py-3">
        <Text className="font-hanken text-[13.5px] leading-5 text-foreground/70">
          {impactLine}
        </Text>
      </View>

      <Pressable
        testID="expense-success-done"
        accessibilityRole="button"
        onPress={onDone}
        className="mt-5 h-14 items-center justify-center rounded-full bg-foreground"
      >
        <Text className="font-hanken-semibold text-[16px] text-background">
          Listo
        </Text>
      </Pressable>
    </View>
  );
}
