import { Pressable, Text, View } from "react-native";
import { AllocationSlider } from "@/modules/onboarding/components/allocation-slider";
import { ENVELOPE_BG } from "@/modules/onboarding/components/envelopes";
import { WizardShell } from "@/modules/onboarding/components/wizard-shell";
import { useOnboarding } from "@/modules/onboarding/onboarding-provider";
import AuthButton from "@/shared/components/auth/auth-button";
import { Check } from "@/shared/components/ui/reicon";
import {
	ALLOCATION_DEFAULTS,
	ENVELOPES,
	setEnvelopeAllocation,
} from "@/shared/lib/onboarding/allocation";
import type { EnvelopeKey } from "@/shared/lib/onboarding/types";

export function Step3Allocation() {
	const { state, dispatch } = useOnboarding();

	const values: Record<EnvelopeKey, number> = {
		needs: state.allocationNeeds,
		wants: state.allocationWants,
		savings: state.allocationSavings,
	};
	const sum = ENVELOPES.reduce((acc, key) => acc + values[key], 0);

	const setEnvelope = (key: EnvelopeKey, value: number) => {
		const next = setEnvelopeAllocation(state, key, value);
		dispatch({ type: "UPDATE", payload: next });
	};

	const resetToDefaults = () => {
		dispatch({ type: "UPDATE", payload: { ...ALLOCATION_DEFAULTS } });
	};

	const continueToCommitments = () => {
		dispatch({ type: "SET_STEP", payload: state.commitmentsSaved ? 5 : 4 });
	};

	return (
		<WizardShell
			stepNumber={3}
			footer={<AuthButton label="Continuar" onPress={continueToCommitments} />}
		>
			<View className="gap-6">
				<View className="gap-1">
					<Text className="font-newsreader text-[28px] text-foreground">
						¿Cómo repartes tu ingreso?
					</Text>
					<Text className="font-hanken text-[14px] text-foreground/55">
						Mueve los sliders hasta que el reparto se sienta tuyo. Puedes volver al 50/30/20 cuando
						quieras.
					</Text>
				</View>

				<View
					testID="allocation-bar"
					className="h-2.5 flex-row gap-0.5 overflow-hidden rounded-full"
				>
					{ENVELOPES.map((key) => (
						<View
							key={key}
							testID={`allocation-bar-segment-${key}`}
							className={`rounded-full ${ENVELOPE_BG[key]}`}
							style={{ flexGrow: values[key], flexBasis: 0 }}
						/>
					))}
				</View>

				<View className="gap-5">
					{ENVELOPES.map((key) => (
						<AllocationSlider
							key={key}
							envelope={key}
							value={values[key]}
							referenceIncomeCents={state.referenceIncomeCents}
							onValueChange={(value) => setEnvelope(key, value)}
						/>
					))}
				</View>

				<View className="flex-row items-center justify-between">
					<View className="flex-row items-center gap-1.5">
						<Text
							testID="allocation-sum"
							className={`font-hanken-semibold text-[13px] ${
								sum === 100 ? "text-savings" : "text-foreground"
							}`}
						>
							{`Suma ${sum}%`}
						</Text>
						{sum === 100 ? <Check size={14} colorClassName="text-savings" /> : null}
					</View>
				</View>

				<Pressable
					testID="allocation-reset"
					accessibilityRole="button"
					onPress={resetToDefaults}
					className="items-center py-2 active:opacity-60"
				>
					<Text className="font-hanken-semibold text-[13px] text-foreground/55">
						Volver al 50/30/20
					</Text>
				</Pressable>
			</View>
		</WizardShell>
	);
}
