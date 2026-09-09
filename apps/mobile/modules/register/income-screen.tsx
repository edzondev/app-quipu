import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import {
  previewIncomeSplit,
  resolveExtraordinaryPolicy,
} from "@/modules/register/allocation";
import {
  EXTRAORDINARY_TYPES,
  HABITUAL_SOURCES,
} from "@/modules/register/constants";
import { buildIncomeEventArgs } from "@/modules/register/income-payload";
import type {
  AllocationWeights,
  DistributionPolicy,
  ExtraordinaryRules,
  ExtraordinaryType,
  IncomeKind,
  IncomeSource,
} from "@/modules/register/types";
import { Money } from "@/shared/components/money/money";
import { ChevronLeft } from "@/shared/components/ui/reicon";
import {
  parseSolesToCents,
  sanitizeSolesInput,
} from "@/shared/lib/onboarding/money";

type Props = {
  weights: AllocationWeights;
  commitmentsRemainingCents: number;
  extraordinaryRules?: Partial<ExtraordinaryRules>;
  submitting?: boolean;
  error?: string | null;
  onBack: () => void;
  onSubmit: (args: ReturnType<typeof buildIncomeEventArgs>) => void;
};

const BAR: Record<"needs" | "wants" | "savings", string> = {
  needs: "bg-needs",
  wants: "bg-wants",
  savings: "bg-savings",
};

const DOT: Record<"needs" | "wants" | "savings", string> = {
  needs: "bg-needs",
  wants: "bg-wants",
  savings: "bg-savings",
};

export function IncomeScreen({
  weights,
  commitmentsRemainingCents,
  extraordinaryRules,
  submitting = false,
  error,
  onBack,
  onSubmit,
}: Props) {
  const [kind, setKind] = useState<IncomeKind>("habitual");
  const [source, setSource] = useState<IncomeSource>("payroll");
  const [extraType, setExtraType] = useState<ExtraordinaryType | undefined>();
  const [extraLabel, setExtraLabel] = useState("");
  const [rawAmount, setRawAmount] = useState("");
  const [pickedPolicy, setPickedPolicy] = useState<
    DistributionPolicy | undefined
  >();
  const [attempted, setAttempted] = useState(false);

  const extraResolved = extraType
    ? resolveExtraordinaryPolicy(extraType, extraordinaryRules)
    : null;
  const policy: DistributionPolicy =
    extraResolved?.askEachTime && pickedPolicy
      ? pickedPolicy
      : (extraResolved?.policy ?? "profile_default");

  const amountCents = parseSolesToCents(rawAmount);
  const preview = useMemo(
    () =>
      previewIncomeSplit({
        amountCents,
        weights,
        policy: kind === "extraordinary" ? policy : "profile_default",
        commitmentsRemainingCents,
      }),
    [amountCents, weights, policy, kind, commitmentsRemainingCents],
  );

  const fieldError =
    attempted && amountCents <= 0
      ? "Escribe el monto recibido."
      : attempted && kind === "extraordinary" && !extraType
        ? "Elige qué recibiste."
        : attempted && extraType === "custom" && extraLabel.trim().length === 0
          ? "Ponle nombre a este ingreso."
          : error;

  const submit = () => {
    if (
      amountCents <= 0 ||
      (kind === "extraordinary" && !extraType) ||
      (extraType === "custom" && extraLabel.trim().length === 0)
    ) {
      setAttempted(true);
      return;
    }
    onSubmit(
      buildIncomeEventArgs({
        amountCents,
        kind,
        source,
        extraordinaryType: extraType,
        extraordinaryLabel: extraLabel.trim() || undefined,
        weights,
        occurredAt: Date.now(),
        policy: kind === "extraordinary" ? policy : undefined,
      }),
    );
  };

  return (
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerClassName="pb-10 gap-6"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row items-center">
          <Pressable
            onPress={onBack}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Volver"
            className="h-10 w-10 items-start justify-center"
          >
            <ChevronLeft size={22} className="text-foreground" />
          </Pressable>
          <Text className="flex-1 text-center font-geist-mono text-[10.5px] tracking-[0.18em] text-foreground/45 uppercase">
            REGISTRAR INGRESO
          </Text>
          <View className="w-10" />
        </View>

        <View className="flex-row rounded-full bg-foreground/6 p-1">
          {(
            [
              ["habitual", "Habitual"],
              ["extraordinary", "Extraordinario"],
            ] as const
          ).map(([value, label]) => {
            const selected = kind === value;
            return (
              <Pressable
                key={value}
                onPress={() => {
                  setKind(value);
                  setPickedPolicy(undefined);
                  setAttempted(false);
                }}
                className={`flex-1 items-center rounded-full py-2.5 ${
                  selected ? "bg-background" : ""
                }`}
              >
                <Text
                  className={`font-hanken-semibold text-[14px] ${
                    selected ? "text-foreground" : "text-foreground/45"
                  }`}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View className="gap-2">
          <Text className="font-geist-mono text-[10.5px] tracking-[0.18em] text-foreground/45 uppercase">
            Monto recibido
          </Text>
          <View className="flex-row items-baseline border-b border-line pb-2">
            <Text className="font-newsreader text-[28px] text-foreground/45">
              S/{" "}
            </Text>
            <TextInput
              testID="income-amount"
              value={rawAmount}
              onChangeText={(next) => setRawAmount(sanitizeSolesInput(next))}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColorClassName="accent-foreground/30"
              className="flex-1 font-newsreader text-[48px] text-foreground"
            />
          </View>
        </View>

        {kind === "habitual" ? (
          <View className="gap-3">
            <Text className="font-geist-mono text-[10.5px] tracking-[0.18em] text-foreground/45 uppercase">
              Origen
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {HABITUAL_SOURCES.map((option) => {
                const selected = source === option.value;
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => setSource(option.value)}
                    className={`rounded-full border px-4 py-2.5 ${
                      selected ? "border-stable" : "border-line"
                    }`}
                  >
                    <Text
                      className={`font-hanken-semibold text-[14px] ${
                        selected ? "text-stable" : "text-foreground/70"
                      }`}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : (
          <View className="gap-3">
            <Text className="font-geist-mono text-[10.5px] tracking-[0.18em] text-foreground/45 uppercase">
              Qué recibiste
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {EXTRAORDINARY_TYPES.map((option) => {
                const selected = extraType === option.type;
                return (
                  <Pressable
                    key={option.type}
                    onPress={() => {
                      setExtraType(option.type);
                      setPickedPolicy(undefined);
                    }}
                    className={`rounded-full border px-4 py-2.5 ${
                      selected ? "border-stable" : "border-line"
                    }`}
                  >
                    <Text
                      className={`font-hanken-semibold text-[14px] ${
                        selected ? "text-stable" : "text-foreground/70"
                      }`}
                    >
                      {option.title}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {extraType === "custom" ? (
              <TextInput
                testID="extraordinary-label"
                value={extraLabel}
                onChangeText={setExtraLabel}
                placeholder="Ponle nombre"
                placeholderTextColorClassName="accent-foreground/35"
                className="border-b border-line pb-2 font-hanken text-[16px] text-foreground"
              />
            ) : null}
            {extraResolved?.askEachTime ? (
              <View className="flex-row gap-2">
                {(
                  [
                    ["profile_default", "Mi distribución"],
                    ["all_to_savings", "Todo al ahorro"],
                  ] as const
                ).map(([value, label]) => {
                  const selected = policy === value;
                  return (
                    <Pressable
                      key={value}
                      onPress={() => setPickedPolicy(value)}
                      className={`flex-1 items-center rounded-full border px-3 py-2.5 ${
                        selected ? "border-stable" : "border-line"
                      }`}
                    >
                      <Text
                        className={`font-hanken-semibold text-[13px] ${
                          selected ? "text-stable" : "text-foreground/70"
                        }`}
                      >
                        {label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}
          </View>
        )}

        <View className="gap-4">
          <Text className="font-geist-mono text-[10.5px] tracking-[0.18em] text-foreground/45 uppercase">
            CÓMO SE REPARTE
          </Text>
          <View className="h-1.5 flex-row overflow-hidden rounded-full bg-foreground/8">
            {preview.envelopes.map((envelope) => (
              <View
                key={envelope.type}
                className={BAR[envelope.type]}
                style={{ flexGrow: envelope.percent, flexBasis: 0 }}
              />
            ))}
          </View>
          {preview.envelopes.map((envelope) => (
            <View
              key={envelope.type}
              className="flex-row items-center justify-between"
            >
              <View className="flex-row items-center gap-2">
                <View
                  className={`h-1.5 w-1.5 rounded-full ${DOT[envelope.type]}`}
                />
                <Text className="font-hanken-semibold text-[15px] text-foreground">
                  {envelope.label}
                </Text>
                <Text className="font-hanken text-[13px] text-foreground/45">
                  {envelope.percent}%
                </Text>
              </View>
              <Money
                cents={envelope.cents}
                className="font-newsreader text-[16px] text-foreground"
              />
            </View>
          ))}
          {preview.commitmentsNote ? (
            <Text className="font-hanken text-[14px] text-foreground/55">
              {preview.commitmentsNote}
            </Text>
          ) : null}
        </View>

        {fieldError ? (
          <Text className="font-hanken text-[13px] text-danger">
            {fieldError}
          </Text>
        ) : null}

        <Pressable
          testID="submit-income"
          accessibilityRole="button"
          onPress={submit}
          disabled={submitting}
          className="h-14 items-center justify-center rounded-full bg-stable"
        >
          <Text className="font-hanken-semibold text-[16px] text-background">
            Registrar y repartir
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
