import { useForm, useStore } from "@tanstack/react-form";
import { Pressable, Text, TextInput, View } from "react-native";
import { AmountInput } from "@/modules/onboarding/components/amount-input";
import { FrequencyPicker } from "@/modules/onboarding/components/frequency-picker";
import { MonoLabel } from "@/modules/onboarding/components/mono-label";
import { WizardShell } from "@/modules/onboarding/components/wizard-shell";
import { useOnboarding } from "@/modules/onboarding/onboarding-provider";
import AuthButton from "@/shared/components/auth/auth-button";
import { Check } from "@/shared/components/ui/reicon";
import { cyclePreview } from "@/shared/lib/onboarding/cycle";
import {
	CYCLE_DURATION_COPY,
	type FixedPayFrequency,
	FREQ_DRIFT_COPY,
	INCOME_AMOUNT_COPY,
	INCOME_MODEL_OPTIONS,
	INCOME_SOURCES_COPY,
	PAY_FREQUENCY_LABEL,
} from "@/shared/lib/onboarding/defaults";
import type { IncomeModel, OnboardingState } from "@/shared/lib/onboarding/types";

export const INCOME_FIELD_DEBOUNCE_MS = 300;
const SOURCE_MAX_LENGTH = 30;
const { base, today } = INCOME_AMOUNT_COPY;

type IncomeDraft = {
	incomeModel: IncomeModel;
	payFrequency: FixedPayFrequency;
	amountRaw: string;
	mixedAmountRaw: string;
	openingRaw: string;
	cycleDurationDays: 15 | 30 | null;
	sourceDraft: string;
	sources: string[];
};

function fixedFrequency(value: OnboardingState["payFrequency"]): FixedPayFrequency {
	if (value === "monthly" || value === "biweekly" || value === "weekly") return value;
	return "monthly";
}

function incomeFieldErrors(value: IncomeDraft): Record<string, string> | undefined {
	const fields: Record<string, string> = {};
	if (value.incomeModel === "variable") {
		if (value.cycleDurationDays !== 15 && value.cycleDurationDays !== 30) {
			fields.cycleDurationDays = "Elige un ciclo de 15 o 30 días.";
		}
		if (value.sources.length < 1) fields.sources = "Agrega al menos una fuente.";
	}
	if (value.incomeModel === "mixed") {
		if (centsFromDigits(value.mixedAmountRaw) == null) {
			fields.mixedAmountRaw = base.missing;
		}
		if (value.sources.length < 1) fields.sources = "Agrega al menos una fuente.";
	}
	return Object.keys(fields).length > 0 ? fields : undefined;
}

function digitsFromCents(cents: number | null | undefined): string {
	return cents != null ? String(Math.floor(cents / 100)) : "";
}

function centsFromDigits(digits: string): number | null {
	return digits ? Number(digits) * 100 : null;
}

function toState(value: IncomeDraft): Partial<OnboardingState> {
	const variable = value.incomeModel === "variable";
	return {
		incomeModel: value.incomeModel,
		payFrequency: variable ? null : value.payFrequency,
		referenceIncomeCents: centsFromDigits(
			value.incomeModel === "fixed" ? value.amountRaw : value.openingRaw,
		),
		mixedFixedAmountCents:
			value.incomeModel === "mixed"
				? (centsFromDigits(value.mixedAmountRaw) ?? undefined)
				: undefined,
		cycleDurationDays:
			variable && value.cycleDurationDays != null ? value.cycleDurationDays : undefined,
		variableIncomeSources: variable || value.incomeModel === "mixed" ? value.sources : [],
	};
}

export function Step1IncomeProfile() {
	const { state, dispatch } = useOnboarding();
	const form = useForm({
		defaultValues: {
			incomeModel: state.incomeModel ?? "fixed",
			payFrequency: fixedFrequency(state.payFrequency),
			amountRaw: digitsFromCents(state.referenceIncomeCents),
			openingRaw: state.incomeModel === "fixed" ? "" : digitsFromCents(state.referenceIncomeCents),
			mixedAmountRaw:
				state.incomeModel === "mixed" ? digitsFromCents(state.mixedFixedAmountCents) : "",
			cycleDurationDays: state.cycleDurationDays ?? null,
			sourceDraft: "",
			sources: state.variableIncomeSources,
		} satisfies IncomeDraft,
		validators: {
			onChange: ({ value }) => {
				const fields = incomeFieldErrors(value);
				if (fields) return { fields };
			},
			onSubmit: ({ value }) => {
				const fields = incomeFieldErrors(value);
				if (fields) return { fields };
			},
		},
		onSubmit: ({ value }) => {
			dispatch({ type: "UPDATE", payload: toState(value) });
			dispatch({ type: "SET_STEP", payload: 2 });
		},
	});
	const incomeModel = useStore(form.store, (s) => s.values.incomeModel);
	const payFrequency = useStore(form.store, (s) => s.values.payFrequency);
	const sources = useStore(form.store, (s) => s.values.sources);
	const cycleDays = useStore(form.store, (s) => s.values.cycleDurationDays);
	const asksPayday = incomeModel === "fixed" || incomeModel === "mixed";

	const addSource = () => {
		const name = form.getFieldValue("sourceDraft").trim().slice(0, SOURCE_MAX_LENGTH);
		if (name.length < 1 || sources.includes(name)) return;
		form.setFieldValue("sources", [...sources, name]);
		form.setFieldValue("sourceDraft", "");
	};

	return (
		<WizardShell
			stepNumber={1}
			footer={
				<form.Subscribe selector={(formState) => formState.canSubmit}>
					{(canSubmit) => (
						<AuthButton
							label="Continuar"
							onPress={() => void form.handleSubmit()}
							disabled={!canSubmit}
						/>
					)}
				</form.Subscribe>
			}
		>
			<View className="gap-1">
				<Text className="font-newsreader text-[28px] text-foreground">¿Cómo entra tu dinero?</Text>
				<Text className="font-hanken text-[14px] text-foreground/55">
					Elige cómo recibes tu dinero. Ya dejamos marcado Fijo y mensual; cámbialo si no es tu
					caso.
				</Text>
			</View>

			<View className="mt-6 gap-3">
				{INCOME_MODEL_OPTIONS.map((option) => {
					const isSelected = incomeModel === option.value;
					return (
						<Pressable
							key={option.value}
							testID={`option-${option.value}`}
							accessibilityRole="button"
							accessibilityState={{ selected: isSelected }}
							onPress={() => {
								if (option.value === incomeModel) return;
								form.setFieldValue("incomeModel", option.value);
								if (option.value === "mixed") form.setFieldValue("mixedAmountRaw", "");
							}}
							className={
								isSelected
									? "flex-row items-start gap-3 rounded-xl border border-primary bg-primary/5 px-4 py-4 active:opacity-80"
									: "flex-row items-start gap-3 rounded-xl border border-line px-4 py-4 active:opacity-80"
							}
						>
							<View className="flex-1 gap-1">
								<Text className="font-hanken-semibold text-[15px] text-foreground">
									{option.title}
								</Text>
								<Text className="font-hanken text-[13px] text-foreground/55">
									{option.description}
								</Text>
							</View>
							{isSelected ? (
								<View
									testID={`check-${option.value}`}
									className="h-6 w-6 items-center justify-center rounded-full bg-primary/10"
								>
									<Check size={14} colorClassName="accent-primary" />
								</View>
							) : null}
						</Pressable>
					);
				})}
			</View>

			{asksPayday ? (
				<View className="mt-6 gap-4">
					<View className="gap-2">
						<MonoLabel>{PAY_FREQUENCY_LABEL}</MonoLabel>
						<FrequencyPicker
							value={payFrequency}
							onChange={(frequency) => form.setFieldValue("payFrequency", frequency)}
						/>
					</View>
					<View className="gap-2">
						<Text className="font-hanken text-[13px] text-foreground/55">
							{FREQ_DRIFT_COPY[payFrequency]}
						</Text>
						<Text className="font-hanken text-[13px] text-foreground/55">
							{cyclePreview(payFrequency)}
						</Text>
					</View>
					<form.Field
						key={incomeModel}
						name={incomeModel === "mixed" ? "mixedAmountRaw" : "amountRaw"}
						listeners={{
							onChange: ({ value, fieldApi }) => {
								const model = form.getFieldValue("incomeModel");
								const cents = centsFromDigits(value);
								if (fieldApi.name === "amountRaw") {
									if (model !== "fixed") return;
									dispatch({ type: "UPDATE", payload: { referenceIncomeCents: cents } });
									return;
								}
								if (model !== "mixed") return;
								dispatch({
									type: "UPDATE",
									payload: { mixedFixedAmountCents: cents ?? undefined },
								});
							},
							onChangeDebounceMs: INCOME_FIELD_DEBOUNCE_MS,
						}}
					>
						{(field) => (
							<AmountInput
								label={incomeModel === "mixed" ? base.label : today.label}
								hint={incomeModel === "mixed" ? base.hint : today.hint}
								valueCents={centsFromDigits(field.state.value)}
								onChangeCents={(cents) => field.handleChange(digitsFromCents(cents))}
							/>
						)}
					</form.Field>
				</View>
			) : (
				<View className="mt-6 gap-4">
					<Text className="font-hanken text-[13px] text-foreground/55">
						Con ingresos variables, Quipu calcula el disponible sobre lo que ya recibiste, nunca
						sobre lo que esperas recibir.
					</Text>
					<View className="gap-1">
						<MonoLabel>{CYCLE_DURATION_COPY.label}</MonoLabel>
						<Text className="font-hanken text-[13px] text-foreground/55">
							{CYCLE_DURATION_COPY.hint}
						</Text>
					</View>
					<View className="flex-row gap-2">
						{([15, 30] as const).map((days) => {
							const isActive = cycleDays === days;
							return (
								<Pressable
									key={days}
									testID={`cycle-pill-${days}`}
									accessibilityRole="button"
									accessibilityState={{ selected: isActive }}
									onPress={() => form.setFieldValue("cycleDurationDays", days)}
									className={
										isActive
											? "flex-1 items-center rounded-full border border-primary bg-primary/5 px-4 py-2.5"
											: "flex-1 items-center rounded-full border border-line px-4 py-2.5"
									}
								>
									<Text className="font-hanken-semibold text-[14px] text-foreground">
										{days} días
									</Text>
								</Pressable>
							);
						})}
					</View>
				</View>
			)}

			{incomeModel === "variable" || incomeModel === "mixed" ? (
				<View className="mt-6 gap-3">
					<View className="gap-1">
						<MonoLabel>{INCOME_SOURCES_COPY.label}</MonoLabel>
						<Text className="font-hanken text-[13px] text-foreground/55">
							{INCOME_SOURCES_COPY.hint}
						</Text>
					</View>
					<form.Field name="sourceDraft">
						{(field) => (
							<View className="flex-row items-center gap-2">
								<TextInput
									testID="source-input"
									value={field.state.value}
									onChangeText={(text) => field.handleChange(text.slice(0, SOURCE_MAX_LENGTH))}
									onBlur={field.handleBlur}
									maxLength={SOURCE_MAX_LENGTH}
									placeholder="Ej. Recibos, ventas"
									onSubmitEditing={addSource}
									className="h-11 flex-1 rounded-xl border border-line px-4 font-hanken text-[14px] text-foreground"
								/>
								<Pressable
									testID="add-source"
									accessibilityRole="button"
									onPress={addSource}
									className="h-11 items-center justify-center rounded-xl bg-foreground px-4 active:opacity-80"
								>
									<Text className="font-hanken-semibold text-[14px] text-background">Agregar</Text>
								</Pressable>
							</View>
						)}
					</form.Field>
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
										accessibilityRole="button"
										accessibilityLabel={`Quitar ${source}`}
										onPress={() =>
											form.setFieldValue(
												"sources",
												sources.filter((_, i) => i !== index),
											)
										}
										hitSlop={8}
									>
										<Text className="font-hanken text-[13px] text-foreground/45">×</Text>
									</Pressable>
								</View>
							))}
						</View>
					) : null}
				</View>
			) : null}

			{incomeModel !== "fixed" ? (
				<form.Field name="openingRaw">
					{(field) => (
						<View className="mt-6">
							<AmountInput
								label={today.label}
								hint={today.hint}
								testID="opening-balance-input"
								valueCents={centsFromDigits(field.state.value)}
								onChangeCents={(cents) => field.handleChange(digitsFromCents(cents))}
							/>
						</View>
					)}
				</form.Field>
			) : null}
			{state.cycleFieldErrors.openingBalanceCents ? (
				<Text
					testID="field-error-openingBalanceCents"
					className="mt-2 font-hanken text-[13px] text-danger"
				>
					{state.cycleFieldErrors.openingBalanceCents}
				</Text>
			) : null}
		</WizardShell>
	);
}
