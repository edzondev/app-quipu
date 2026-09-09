import { Slider } from "@expo/ui/community/slider";
import { Text, View } from "react-native";
import { Money } from "@/shared/components/money/money";
import type { EnvelopeKey } from "@/shared/lib/onboarding/types";
import { ENVELOPE_BG, ENVELOPE_LABELS } from "./envelopes";

// Hex equivalentes a los tokens oklch (--color-*) para el tint nativo del Slider.
const ENVELOPE_TINT: Record<EnvelopeKey, string> = {
  needs: "#7181a0",
  wants: "#aa8a72",
  savings: "#5e8e7d",
};

const TRACK_TINT = "#E8E6DF";

type AllocationSliderProps = {
  envelope: EnvelopeKey;
  value: number;
  referenceIncomeCents: number | null;
  onValueChange: (value: number) => void;
};

export function AllocationSlider({
  envelope,
  value,
  referenceIncomeCents,
  onValueChange,
}: AllocationSliderProps) {
  return (
    <View className="gap-2">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <View
            className={`h-2.5 w-2.5 rounded-full ${ENVELOPE_BG[envelope]}`}
          />
          <Text className="font-hanken-semibold text-[15px] text-foreground">
            {ENVELOPE_LABELS[envelope]}
          </Text>
        </View>
        <View className="flex-row items-baseline gap-2">
          <Text
            testID={`allocation-percent-${envelope}`}
            className="font-hanken-semibold text-[15px] text-foreground"
          >
            {`${value}%`}
          </Text>
          {referenceIncomeCents ? (
            <Money
              cents={Math.floor((referenceIncomeCents * value) / 100)}
              testID={`allocation-amount-${envelope}`}
              className="font-hanken text-[13px] text-foreground/45"
            />
          ) : null}
        </View>
      </View>
      <View testID={`allocation-slider-${envelope}`} className="w-full">
        <Slider
          value={value}
          minimumValue={0}
          maximumValue={100}
          minimumTrackTintColor={ENVELOPE_TINT[envelope]}
          maximumTrackTintColor={TRACK_TINT}
          thumbTintColor={ENVELOPE_TINT[envelope]}
          onValueChange={(raw) => onValueChange(Math.round(raw))}
          style={{ width: "100%", height: 32 }}
        />
      </View>
    </View>
  );
}
