import { useForm, useStore } from "@tanstack/react-form";
import { Pressable, Text, TextInput, View } from "react-native";
import { EnvelopeChoices } from "@/shared/components/expenses/envelope-choices";
import { ErrorText } from "@/shared/components/forms/field-error";
import {
	COMMITMENT_QUICK_NAMES,
	type CommitmentFormValues,
	type CreateCommitmentArgs,
	DUE_DAY_ERROR,
	dueDayHint,
	parseDueDay,
	toCreateCommitment,
} from "@/shared/lib/commitments/model";
import { readActionError } from "@/shared/lib/expenses/errors";
import { formErrorMessage } from "@/shared/lib/form";
import { HIT_SLOP } from "@/shared/lib/hit-slop";

const DEFAULT_VALUES: CommitmentFormValues = {
	name: "",
	amountRaw: "",
	dueDay: "",
	envelope: "needs",
};

type Props = {
	onSubmit: (args: CreateCommitmentArgs) => Promise<void>;
	onCancel: () => void;
};

export function CommitmentForm({ onSubmit, onCancel }: Props) {
	const form = useForm({
		defaultValues: DEFAULT_VALUES,
		validators: {
			onSubmit: ({ value }) => {
				const draft = toCreateCommitment(value);
				if (!draft.ok) return { fields: draft.fields };
			},
		},
		onSubmit: async ({ value, formApi }) => {
			const draft = toCreateCommitment(value);
			if (!draft.ok) return;
			try {
				await onSubmit(draft.args);
			} catch (error) {
				formApi.setErrorMap({
					onSubmit: {
						form: readActionError(error, "No se pudo guardar el compromiso."),
						fields: {},
					},
				});
			}
		},
	});
	const isSubmitting = useStore(form.store, (state) => state.isSubmitting);
	const formError = useStore(form.store, (state) => formErrorMessage(state.errorMap.onSubmit));

	return (
		<View className="flex-1 px-[22px] pt-1.5 pb-8">
			<View className="flex-row items-center justify-between">
				<Text className="font-geist-mono text-[10.5px] uppercase tracking-[0.14em] text-foreground/55">
					NUEVO COMPROMISO
				</Text>
				<Pressable
					accessibilityRole="button"
					accessibilityLabel="Cancelar"
					hitSlop={HIT_SLOP}
					onPress={onCancel}
					className="active:opacity-60"
				>
					<Text className="font-hanken-semibold text-[13px] text-foreground/45">Cancelar</Text>
				</Pressable>
			</View>

			<form.Field name="name">
				{(field) => (
					<View>
						<TextInput
							value={field.state.value}
							onChangeText={field.handleChange}
							onBlur={field.handleBlur}
							placeholder="Nombre"
							placeholderTextColor="#8C8880"
							maxLength={80}
							accessibilityLabel="Nombre"
							className="mt-6 border-b border-line pb-3 font-hanken text-[16px] text-foreground"
						/>
						<FieldNote error={field.state.meta.errors[0]} />
					</View>
				)}
			</form.Field>

			<View className="mt-4 flex-row flex-wrap gap-2">
				{COMMITMENT_QUICK_NAMES.map((name) => (
					<Pressable
						key={name}
						accessibilityRole="button"
						accessibilityLabel={`Agregar ${name}`}
						hitSlop={HIT_SLOP}
						onPress={() => form.setFieldValue("name", name === "Otro" ? "" : name)}
						className="rounded-full border border-line px-3.5 py-[9px] active:opacity-60"
					>
						<Text className="font-hanken-semibold text-[13px] text-foreground">{`+ ${name}`}</Text>
					</Pressable>
				))}
			</View>

			<form.Field name="amountRaw">
				{(field) => (
					<View>
						<TextInput
							value={field.state.value}
							onChangeText={field.handleChange}
							onBlur={field.handleBlur}
							placeholder="Monto"
							placeholderTextColor="#8C8880"
							keyboardType="decimal-pad"
							accessibilityLabel="Monto"
							className="mt-6 border-b border-line pb-3 font-hanken text-[16px] text-foreground"
						/>
						<FieldNote error={field.state.meta.errors[0]} />
					</View>
				)}
			</form.Field>

			<form.Field
				name="dueDay"
				validators={{
					onChange: ({ value }) =>
						value && parseDueDay(value) == null ? DUE_DAY_ERROR : undefined,
				}}
			>
				{(field) => (
					<View>
						<TextInput
							value={field.state.value}
							onChangeText={field.handleChange}
							onBlur={field.handleBlur}
							placeholder="Día de vencimiento"
							placeholderTextColor="#8C8880"
							keyboardType="number-pad"
							maxLength={2}
							accessibilityLabel="Día de vencimiento"
							className="mt-6 border-b border-line pb-3 font-hanken text-[16px] text-foreground"
						/>
						<FieldNote
							error={field.state.meta.errors[0]}
							hint={dueDayHint(field.state.value, Date.now())}
						/>
					</View>
				)}
			</form.Field>

			<Text className="mt-6 font-geist-mono text-[10.5px] tracking-[0.14em] text-foreground/55">
				SOBRE
			</Text>
			<form.Field name="envelope">
				{(field) => (
					<View className="mt-3">
						<EnvelopeChoices
							value={field.state.value}
							disabled={isSubmitting}
							onChange={field.handleChange}
						/>
					</View>
				)}
			</form.Field>

			{formError ? <ErrorText message={formError} /> : null}
			<Pressable
				testID="commitment-submit"
				accessibilityRole="button"
				accessibilityLabel="Agregar compromiso"
				accessibilityState={{ disabled: isSubmitting }}
				disabled={isSubmitting}
				onPress={() => void form.handleSubmit()}
				className={`mt-8 items-center rounded-[13px] bg-foreground py-4 active:opacity-80 ${
					isSubmitting ? "opacity-60" : ""
				}`}
			>
				<Text className="font-hanken-semibold text-[15px] text-background">
					{isSubmitting ? "Guardando…" : "Agregar compromiso"}
				</Text>
			</Pressable>
		</View>
	);
}

function FieldNote({ error, hint }: { error: unknown; hint?: string }) {
	if (typeof error === "string" && error) return <ErrorText message={error} />;
	if (!hint) return null;
	return <Text className="mt-2 font-hanken text-[13px] text-foreground/45">{hint}</Text>;
}
