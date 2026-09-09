import { Text, TextInput, View } from "react-native";
import { MonoLabel } from "./mono-label";

type AmountInputProps = {
  label?: string;
  valueCents: number | null;
  onChangeCents: (cents: number | null) => void;
};

function digitsFromCents(cents: number | null): string {
  return cents != null ? String(Math.floor(cents / 100)) : "";
}

function formatThousands(digits: string): string {
  if (!digits) return "";
  return Number(digits).toLocaleString("es-PE");
}

export function AmountInput({
  label,
  valueCents,
  onChangeCents,
}: AmountInputProps) {
  const digits = digitsFromCents(valueCents);

  const handleChange = (raw: string) => {
    const next = raw.replace(/\D/g, "").slice(0, 9);
    onChangeCents(next ? Number(next) * 100 : null);
  };

  return (
    <View className="gap-2">
      {label ? <MonoLabel>{label}</MonoLabel> : null}
      <View className="flex-row items-baseline gap-2 border-b border-line pb-2">
        <Text className="font-newsreader text-[24px] text-foreground/45">
          S/
        </Text>
        <TextInput
          testID="amount-input"
          value={formatThousands(digits)}
          onChangeText={handleChange}
          keyboardType="number-pad"
          placeholder="0"
          className="flex-1 font-newsreader text-[40px] text-foreground"
        />
      </View>
    </View>
  );
}
