import { useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { CommitmentRow } from "@/modules/onboarding/components/commitment-row";
import { MonoLabel } from "@/modules/onboarding/components/mono-label";
import { WizardShell } from "@/modules/onboarding/components/wizard-shell";
import { useOnboarding } from "@/modules/onboarding/onboarding-provider";
import AuthButton from "@/shared/components/auth/auth-button";
import { Money } from "@/shared/components/money/money";
import {
  isCommitmentValid,
  isNamedChipTaken,
  validCommitmentsTotalCents,
} from "@/shared/lib/onboarding/commitments";
import type { DraftCommitment } from "@/shared/lib/onboarding/types";

const QUICK_CHIPS = ["Agua", "Celular", "Gimnasio", "Streaming", "Otro"];

export function Step4Commitments() {
  const { state, dispatch } = useOnboarding();
  const idCounter = useRef(0);
  const [showFieldErrors, setShowFieldErrors] = useState(false);

  const addQuickCommitment = (name: string) => {
    idCounter.current += 1;
    dispatch({
      type: "ADD_COMMITMENT",
      payload: {
        id: `${Date.now()}-${idCounter.current}`,
        name,
        amountCents: 0,
        dueDay: 0,
      },
    });
  };

  const updateCommitment = (next: DraftCommitment) => {
    dispatch({ type: "UPDATE_COMMITMENT", payload: next });
  };

  const removeCommitment = (id: string) => {
    dispatch({ type: "REMOVE_COMMITMENT", payload: id });
  };

  const allValid = state.commitments.every(isCommitmentValid);
  const totalCents = validCommitmentsTotalCents(state.commitments);

  const goConfirm = () => {
    dispatch({ type: "SET_STEP", payload: "confirm" });
  };

  const continueToConfirm = () => {
    if (!allValid) {
      setShowFieldErrors(true);
      return;
    }
    goConfirm();
  };

  return (
    <WizardShell
      stepNumber={4}
      footer={
        <View className="gap-3">
          <AuthButton label="Continuar" onPress={continueToConfirm} />
          <Pressable
            testID="commitments-skip"
            onPress={goConfirm}
            className="items-center py-2"
          >
            <Text className="font-hanken-semibold text-[13px] text-foreground/55">
              Después
            </Text>
          </Pressable>
        </View>
      }
    >
      <View className="gap-6">
        <View className="gap-1">
          <Text className="font-newsreader text-[28px] text-foreground">
            ¿Qué pagas todos los meses?
          </Text>
          <Text className="font-hanken text-[14px] text-foreground/55">
            Los reservamos de Necesidades para que nunca aparezcan como
            sorpresa.
          </Text>
        </View>

        <View className="flex-row flex-wrap gap-2">
          {QUICK_CHIPS.map((name) => {
            const taken = isNamedChipTaken(name, state.commitments);
            return (
              <Pressable
                key={name}
                testID={`chip-${name.toLowerCase()}`}
                onPress={() => {
                  if (taken) return;
                  addQuickCommitment(name);
                }}
                disabled={taken}
                className={
                  taken
                    ? "rounded-full border border-line px-3.5 py-2 opacity-40"
                    : "rounded-full border border-dashed border-line px-3.5 py-2"
                }
              >
                <Text
                  className={
                    taken
                      ? "font-hanken text-[13px] text-foreground/40"
                      : "font-hanken text-[13px] text-foreground/70"
                  }
                >
                  {`+ ${name}`}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {state.commitments.length > 0 ? (
          <View className="gap-3">
            {state.commitments.map((commitment, index) => (
              <CommitmentRow
                key={commitment.id}
                index={index}
                commitment={commitment}
                onChange={updateCommitment}
                onRemove={() => removeCommitment(commitment.id)}
                showErrors={showFieldErrors}
              />
            ))}
          </View>
        ) : null}

        <View className="flex-row items-center justify-between">
          <MonoLabel>Se reserva de Necesidades</MonoLabel>
          <Money
            cents={totalCents}
            testID="commitments-total"
            className="font-hanken-semibold text-[13px] text-foreground"
          />
        </View>
      </View>
    </WizardShell>
  );
}
