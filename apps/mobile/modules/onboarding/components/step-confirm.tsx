import { Pressable, Text, View } from "react-native";
import { useOnboarding } from "@/modules/onboarding/onboarding-provider";
import { useCompleteOnboarding } from "@/modules/onboarding/use-complete-onboarding";
import { Money } from "@/shared/components/money/money";
import { ChevronLeft } from "@/shared/components/ui/reicon";
import { validCommitmentsTotalCents } from "@/shared/lib/onboarding/commitments";
import {
  currentMonthLabel,
  cycleDaysForModel,
} from "@/shared/lib/onboarding/cycle";
import { estimateDailyAvailable } from "@/shared/lib/onboarding/daily";
import { MonoLabel } from "./mono-label";

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <View className="flex-row items-center justify-between">
      <Text className="font-hanken text-[14px] text-foreground/70">
        {label}
      </Text>
      {value}
    </View>
  );
}

export function StepConfirm() {
  const { state, dispatch } = useOnboarding();
  const { submit, isSubmitting, error } = useCompleteOnboarding();

  const referenceCents = state.referenceIncomeCents;
  const commitmentsTotalCents = validCommitmentsTotalCents(state.commitments);

  const dailyCents =
    referenceCents == null
      ? null
      : estimateDailyAvailable({
          referenceIncomeCents: referenceCents,
          commitmentsTotalCents,
          allocationNeeds: state.allocationNeeds,
          allocationWants: state.allocationWants,
          allocationSavings: state.allocationSavings,
          cycleDays: cycleDaysForModel(state),
        });

  const envelopeAmount = (pct: number) =>
    referenceCents == null ? null : Math.floor((referenceCents * pct) / 100);

  const envelopes = [
    { key: "needs", label: "Necesidades", pct: state.allocationNeeds },
    { key: "wants", label: "Gustos", pct: state.allocationWants },
    { key: "savings", label: "Ahorro", pct: state.allocationSavings },
  ] as const;

  return (
    <View className="flex-1 bg-background px-6 pt-16">
      <View className="h-14 flex-row items-center">
        <Pressable
          testID="confirm-back"
          onPress={() => dispatch({ type: "SET_STEP", payload: 4 })}
          hitSlop={12}
          className="-ml-1 px-1 py-2"
        >
          <ChevronLeft size={22} colorClassName="accent-foreground" />
        </Pressable>
      </View>

      <View className="flex-1 pt-4">
        <View className="gap-4">
          <MonoLabel>CONFIRMA TU SISTEMA</MonoLabel>
          <Text className="font-newsreader text-[28px] text-foreground">
            {`Así queda tu ciclo de ${currentMonthLabel()}`}
          </Text>
        </View>

        <View
          testID="confirm-daily-card"
          className="mt-6 rounded-xl bg-primary/10 px-4 py-4"
        >
          <MonoLabel>PODRÁS GASTAR AL DÍA</MonoLabel>
          {dailyCents == null ? (
            <Text
              testID="confirm-daily"
              className="mt-2 font-geist-mono text-[32px] text-foreground"
            >
              —
            </Text>
          ) : (
            <Money
              testID="confirm-daily"
              cents={dailyCents}
              alwaysDecimals
              className="mt-2 font-geist-mono text-[32px] text-foreground"
            />
          )}
          {referenceCents == null ? (
            <Text className="mt-2 font-hanken text-[13px] text-foreground/55">
              Registra tu primer ingreso para ver tu disponible al día.
            </Text>
          ) : null}
        </View>

        <View className="mt-6 gap-3">
          <SummaryRow
            label="Ingreso del ciclo"
            value={
              referenceCents == null ? (
                <Text
                  testID="confirm-income"
                  className="font-hanken-semibold text-[14px] text-foreground"
                >
                  —
                </Text>
              ) : (
                <Money
                  testID="confirm-income"
                  cents={referenceCents}
                  className="font-hanken-semibold text-[14px] text-foreground"
                />
              )
            }
          />

          {envelopes.map((envelope) => {
            const amount = envelopeAmount(envelope.pct);
            return (
              <SummaryRow
                key={envelope.key}
                label={envelope.label}
                value={
                  amount == null ? (
                    <Text
                      testID={`confirm-envelope-${envelope.key}`}
                      className="font-hanken-semibold text-[14px] text-foreground"
                    >
                      {`${envelope.pct}%`}
                    </Text>
                  ) : (
                    <View
                      testID={`confirm-envelope-${envelope.key}`}
                      className="flex-row items-baseline"
                    >
                      <Text className="font-hanken-semibold text-[14px] text-foreground">
                        {`${envelope.pct}% · `}
                      </Text>
                      <Money
                        cents={amount}
                        className="font-hanken-semibold text-[14px] text-foreground"
                      />
                    </View>
                  )
                }
              />
            );
          })}

          <SummaryRow
            label="Compromisos reservados"
            value={
              <Money
                testID="confirm-commitments"
                cents={commitmentsTotalCents}
                className="font-hanken-semibold text-[14px] text-foreground"
              />
            }
          />
        </View>

        <Text className="mt-6 font-hanken text-[13px] text-foreground/45">
          Puedes cambiar cualquiera de estos números después, desde Ajustes · Tu
          sistema.
        </Text>

        {error ? (
          <Text
            testID="confirm-error"
            className="mt-4 font-hanken text-[13px] text-danger"
          >
            {error}
          </Text>
        ) : null}
      </View>

      <View className="gap-3 pb-4">
        <Pressable
          testID="confirm-submit"
          onPress={submit}
          disabled={isSubmitting}
          className="items-center rounded-xl bg-primary px-5 py-3.5"
        >
          <Text className="font-hanken-semibold text-[15px] text-background">
            {isSubmitting ? "Creando…" : "Empezar mi ciclo"}
          </Text>
        </Pressable>
        <Pressable
          testID="confirm-adjust"
          onPress={() => dispatch({ type: "SET_STEP", payload: 3 })}
          className="items-center py-2"
        >
          <Text className="font-hanken-semibold text-[13px] text-foreground/55">
            Ajustar algo
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
