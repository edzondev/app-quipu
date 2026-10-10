import { Pressable, Text, View } from "react-native";
import { AllocationRow } from "@/modules/onboarding/components/allocation-row";
import { ENVELOPE_BG } from "@/modules/onboarding/components/envelopes";
import { WizardShell } from "@/modules/onboarding/components/wizard-shell";
import { useOnboarding } from "@/modules/onboarding/onboarding-provider";
import AuthButton from "@/shared/components/auth/auth-button";
import {
	ALLOCATION_DEFAULTS,
	ALLOCATION_STEP,
	allocationValue,
	type EditableEnvelope,
	ENVELOPES,
	maxAllocation,
	stepEnvelopeAllocation,
} from "@/shared/lib/onboarding/allocation";

const EDITABLE: readonly EditableEnvelope[] = ["needs", "wants"];

export function Step3Allocation() {
	const { state, dispatch } = useOnboarding();

	const step = (envelope: EditableEnvelope, direction: 1 | -1) => {
		dispatch({ type: "UPDATE", payload: stepEnvelopeAllocation(state, envelope, direction) });
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
			footer={
				<AuthButton label="Continuar" testID="wizard-continue" onPress={continueToCommitments} />
			}
		>
			<View className="gap-6">
				<View className="gap-1">
					<Text className="font-newsreader text-[28px] text-foreground">
						¿Cómo repartes tu dinero?
					</Text>
					<Text className="font-hanken text-[14px] text-foreground/55">
						Cada vez que cobras, Quipu separa tu ingreso en tres sobres. Partimos de 50/30/20, un
						reparto muy usado. Sube o baja Necesidades y Gustos de a {ALLOCATION_STEP} puntos;
						Ahorro siempre es lo que queda.
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
							style={{ flexGrow: allocationValue(state, key), flexBasis: 0 }}
						/>
					))}
				</View>

				<View className="gap-3">
					{EDITABLE.map((envelope) => {
						const value = allocationValue(state, envelope);
						return (
							<AllocationRow
								key={envelope}
								envelope={envelope}
								value={value}
								referenceIncomeCents={state.referenceIncomeCents}
								editable
								canDecrease={value > 0}
								canIncrease={value < maxAllocation(state, envelope)}
								onDecrease={() => step(envelope, -1)}
								onIncrease={() => step(envelope, 1)}
							/>
						);
					})}
					<AllocationRow
						envelope="savings"
						value={state.allocationSavings}
						referenceIncomeCents={state.referenceIncomeCents}
						editable={false}
					/>
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
