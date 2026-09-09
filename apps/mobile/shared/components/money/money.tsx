import { cn } from "cn";
import { Text, View } from "react-native";
import { Minus, Plus } from "@/shared/components/ui/reicon";

export type MoneyTone =
  | "neutral"
  | "income"
  | "expense"
  | "needs"
  | "wants"
  | "savings";

export type MoneySign = false | "auto" | "plus" | "minus";

type SignIcon = typeof Plus;

type Props = {
  cents: number | null | undefined;
  tone?: MoneyTone;
  sign?: MoneySign;
  /** Si true, muestra siempre ".XX" aunque el residuo sea 0. */
  alwaysDecimals?: boolean;
  /** "hero" divide enteros y decimales en Text anidados (entero grande + decimal chico). */
  size?: "default" | "hero";
  className?: string;
  testID?: string;
};

const TONE: Record<MoneyTone, string> = {
  neutral: "text-foreground",
  income: "text-primary",
  expense: "text-danger",
  needs: "text-needs",
  wants: "text-wants",
  savings: "text-savings",
};

const SIGN_SIZE = {
  default: 12,
  hero: 32,
} as const;

function resolveSignIcon(sign: MoneySign, tone: MoneyTone): SignIcon | null {
  if (sign === "auto") {
    if (tone === "income") return Plus;
    if (tone === "expense") return Minus;
    return null;
  }
  if (sign === "plus") return Plus;
  if (sign === "minus") return Minus;
  return null;
}

function splitCents(cents: number, alwaysDecimals: boolean) {
  const abs = Math.abs(cents);
  const soles = Math.floor(abs / 100);
  const rem = abs % 100;
  const intPart = soles.toLocaleString("es-PE");
  const decPart = String(rem).padStart(2, "0");
  const showDecimals = alwaysDecimals || rem !== 0;
  return { intPart, decPart, showDecimals };
}

export function Money({
  cents,
  tone = "neutral",
  sign = false,
  alwaysDecimals = false,
  size = "default",
  className,
  testID,
}: Props) {
  const SignIcon = resolveSignIcon(sign, tone);
  const signSize = SIGN_SIZE[size];
  const toneClass = TONE[tone];

  if (cents == null) {
    return (
      <View className="flex-row items-baseline">
        <Text testID={testID} className={cn("text-foreground/30", className)}>
          S/ —
        </Text>
      </View>
    );
  }

  const { intPart, decPart, showDecimals } = splitCents(cents, alwaysDecimals);

  return (
    <View className="flex-row items-baseline">
      {SignIcon ? (
        <SignIcon
          size={signSize}
          className={cn(toneClass, size === "hero" ? "mr-2" : "mr-1")}
        />
      ) : null}
      {size === "hero" ? (
        <Text
          testID={testID}
          className={cn("tabular-nums", toneClass, className)}
          selectable
        >
          <Text className="text-[32px]">S/ </Text>
          <Text>{intPart}</Text>
          {showDecimals ? (
            <Text className="text-[32px] text-foreground/45">.{decPart}</Text>
          ) : null}
        </Text>
      ) : (
        <Text
          testID={testID}
          className={cn("tabular-nums", toneClass, className)}
          selectable
        >
          S/ {intPart}
          {showDecimals ? `.${decPart}` : ""}
        </Text>
      )}
    </View>
  );
}
