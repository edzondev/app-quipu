import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { AmountInput } from "@/modules/onboarding/components/amount-input";
import { FrequencyPicker } from "@/modules/onboarding/components/frequency-picker";
import { MonoLabel } from "@/modules/onboarding/components/mono-label";
import { WizardShell } from "@/modules/onboarding/components/wizard-shell";
import { useOnboarding } from "@/modules/onboarding/onboarding-provider";
import AuthButton from "@/shared/components/auth/auth-button";
import { cyclePreview, paydayText } from "@/shared/lib/onboarding/cycle";
import { FREQ_DRIFT_COPY } from "@/shared/lib/onboarding/defaults";
import type { OnboardingState } from "@/shared/lib/onboarding/types";

const SOURCE_MAX_LENGTH = 30;

function StepHeader({ title, subtitle }: { title: string; subtitle: string }) {
	return (
		<View className="gap-1">
			<Text className="font-newsreader text-[28px] text-foreground">{title}</Text>
			<Text className="font-hanken text-[14px] text-foreground/55">{subtitle}</Text>
		</View>
	);
}

function SourcesSection() {
	const { state, dispatch } = useOnboarding();
	const sources = state.variableIncomeSources;
	const [draft, setDraft] = useState("");

	const addSource = () => {
		const name = draft.trim().slice(0, SOURCE_MAX_LENGTH);
		if (name.length < 1 || sources.includes(name)) return;
		dispatch({
			type: "UPDATE",
			payload: { variableIncomeSources: [...sources, name] },
		});
		setDraft("");
	};

	const removeSource = (index: number) => {
		dispatch({
			type: "UPDATE",
			payload: {
				variableIncomeSources: sources.filter((_, i) => i !== index),
			},
		});
	};

	return (
		<View className="gap-3">
			<MonoLabel>¿DE DÓNDE LLEGA TU DINERO?</MonoLabel>
			<View className="flex-row items-center gap-2">
				<TextInput
					testID="source-input"
					value={draft}
					onChangeText={(text) => setDraft(text.slice(0, SOURCE_MAX_LENGTH))}
					maxLength={SOURCE_MAX_LENGTH}
					placeholder="Ej. Recibos, ventas, proyectos"
					onSubmitEditing={addSource}
					className="h-11 flex-1 rounded-xl border border-line px-4 font-hanken text-[14px] text-foreground"
				/>
				<Pressable
					testID="add-source"
					onPress={addSource}
					className="h-11 items-center justify-center rounded-xl bg-foreground px-4"
				>
					<Text className="font-hanken-semibold text-[14px] text-background">Agregar</Text>
				</Pressable>
			</View>
			{sources.length > 0 ? (
				<View className="flex-row flex-wrap gap-2">
					{sources.map((source, index) => (
						<View
							key={source}
							className="flex-row items-center gap-1.5 rounded-full border border-line px-3 py-1.5"
						>
							<Text
								testID={`source-chip-${index}`}
								className="font-hanken text-[13px] text-foreground"
							>
								{source}
							</Text>
							<Pressable
								testID={`remove-source-${index}`}
								onPress={() => removeSource(index)}
								hitSlop={8}
								className="px-1"
							>
								<Text className="font-hanken text-[13px] text-foreground/45">×</Text>
							</Pressable>
						</View>
					))}
				</View>
			) : null}
		</View>
	);
}

function FixedFields() {
	const { state, dispatch } = useOnboarding();
	const frequency = state.payFrequency;

	return (
		<View className="gap-6">
			<StepHeader
				title="¿Cuándo y cuánto?"
				subtitle="Con esto armamos tu primer ciclo. Después lo afinamos con datos reales."
			/>

			<View className="gap-3">
				<FrequencyPicker
					value={frequency}
					onChange={(f) => dispatch({ type: "UPDATE", payload: { payFrequency: f } })}
				/>
			</View>

			{frequency ? (
				<View className="gap-3">
					<MonoLabel>DÍA DE PAGO</MonoLabel>
					<Text className="font-hanken-semibold text-[15px] text-foreground">
						{paydayText(frequency)}
					</Text>
					<Text className="font-hanken text-[13px] text-foreground/55">
						{FREQ_DRIFT_COPY[frequency]}
					</Text>
				</View>
			) : null}

			<AmountInput
				label="CUÁNTO SUELES RECIBIR"
				valueCents={state.referenceIncomeCents}
				onChangeCents={(cents) =>
					dispatch({
						type: "UPDATE",
						payload: { referenceIncomeCents: cents },
					})
				}
			/>
			<Text className="font-hanken text-[13px] text-foreground/55">
				Es solo una referencia para armar el primer ciclo. Cuando registres tu ingreso real, Quipu
				recalcula.
			</Text>

			{frequency ? (
				<View className="rounded-xl border border-line px-4 py-3">
					<MonoLabel>TU CICLO SERÍA</MonoLabel>
					<Text className="mt-1 font-hanken-semibold text-[15px] text-foreground">
						{cyclePreview(frequency)}
					</Text>
				</View>
			) : null}
		</View>
	);
}

function VariableFields() {
	const { state, dispatch } = useOnboarding();
	const cycleDays = state.cycleDurationDays;

	return (
		<View className="gap-6">
			<StepHeader
				title="¿Cómo se arma tu ciclo?"
				subtitle="Sin fecha fija, el ciclo va de un ingreso registrado al siguiente."
			/>

			<View className="gap-3">
				<MonoLabel>DURACIÓN DEL CICLO</MonoLabel>
				<View className="flex-row gap-2">
					{([15, 30] as const).map((days) => {
						const isActive = cycleDays === days;
						return (
							<Pressable
								key={days}
								testID={`cycle-pill-${days}`}
								onPress={() =>
									dispatch({
										type: "UPDATE",
										payload: { cycleDurationDays: days },
									})
								}
								className={
									isActive
										? "flex-1 items-center rounded-full border border-primary bg-primary/5 px-4 py-2.5"
										: "flex-1 items-center rounded-full border border-line px-4 py-2.5"
								}
							>
								<Text
									className={
										isActive
											? "font-hanken-semibold text-[14px] text-foreground"
											: "font-hanken text-[14px] text-foreground/55"
									}
								>
									{days} días
								</Text>
							</Pressable>
						);
					})}
				</View>
			</View>

			<SourcesSection />
		</View>
	);
}

function MixedFields() {
	const { state, dispatch } = useOnboarding();
	const frequency = state.payFrequency;

	return (
		<View className="gap-6">
			<StepHeader
				title="Tu base + lo extra"
				subtitle="Define la parte fija y cuéntanos de dónde llega lo variable."
			/>

			<View className="gap-3">
				<FrequencyPicker
					value={frequency}
					onChange={(f) => dispatch({ type: "UPDATE", payload: { payFrequency: f } })}
				/>
			</View>

			{frequency ? (
				<View className="gap-2">
					<MonoLabel>DÍA DE PAGO</MonoLabel>
					<Text className="font-hanken-semibold text-[15px] text-foreground">
						{paydayText(frequency)}
					</Text>
				</View>
			) : null}

			<AmountInput
				label="PARTE FIJA APROXIMADA"
				valueCents={state.mixedFixedAmountCents ?? null}
				onChangeCents={(cents) =>
					dispatch({
						type: "UPDATE",
						payload: { mixedFixedAmountCents: cents ?? undefined },
					})
				}
			/>

			<SourcesSection />
		</View>
	);
}

function canContinueFrom(state: OnboardingState): boolean {
	switch (state.incomeModel) {
		case "fixed":
			return state.payFrequency != null;
		case "variable":
			return state.cycleDurationDays != null && state.variableIncomeSources.length >= 1;
		case "mixed":
			return (
				state.payFrequency != null &&
				state.mixedFixedAmountCents != null &&
				state.variableIncomeSources.length >= 1
			);
		default:
			return false;
	}
}

export function Step2System() {
	const { state, dispatch } = useOnboarding();
	const model = state.incomeModel;

	const continueToStep3 = () => {
		if (!canContinueFrom(state)) return;
		dispatch({ type: "SET_STEP", payload: 3 });
	};

	return (
		<WizardShell
			stepNumber={2}
			footer={
				<AuthButton
					label="Continuar"
					onPress={continueToStep3}
					disabled={!canContinueFrom(state)}
				/>
			}
		>
			{model === "fixed" ? <FixedFields /> : null}
			{model === "variable" ? <VariableFields /> : null}
			{model === "mixed" ? <MixedFields /> : null}
		</WizardShell>
	);
}
