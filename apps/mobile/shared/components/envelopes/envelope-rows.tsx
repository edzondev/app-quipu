import { Text, View } from "react-native";
import type { HomeEnvelope } from "@/shared/lib/dashboard/home-model";
import { formatCents } from "@/shared/lib/money";

const TONE_BAR = {
  needs: "bg-needs",
  wants: "bg-wants",
  savings: "bg-savings",
} as const;

const TRACK = "bg-[#E8E6DF]";

export function EnvelopeRows({
  rows,
  symbol = "S/",
}: {
  rows: HomeEnvelope[];
  symbol?: string;
}) {
  return (
    <View className="gap-4">
      {rows.map((envelope) => (
        <View key={envelope.label} className="gap-1.5">
          <View className="flex-row items-center justify-between">
            <Text className="font-hanken-semibold text-[15px] text-foreground">
              {envelope.label}
            </Text>
            <View className="flex-row items-baseline gap-1">
              <Text
                className="font-newsreader text-[16px] text-foreground"
                selectable
              >
                {formatCents(envelope.spentCents, symbol)}
              </Text>
              <Text className="font-hanken text-[13px] text-foreground/45">
                {envelope.suffix}
              </Text>
            </View>
          </View>
          <View
            className={`h-0.75 w-full overflow-hidden rounded-full ${TRACK}`}
          >
            <View
              className={`h-full rounded-full ${TONE_BAR[envelope.tone]}`}
              style={{ width: `${envelope.progress}%` }}
            />
          </View>
        </View>
      ))}
    </View>
  );
}
