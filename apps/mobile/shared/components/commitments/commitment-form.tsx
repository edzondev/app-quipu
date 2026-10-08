import { useForm } from "@tanstack/react-form";
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { EnvelopeChoices } from "@/shared/components/expenses/envelope-choices";
import {
	type CommitmentField,
	type CommitmentFormValues,
	type CreateCommitmentArgs,
	toCreateCommitment,
} from "@/shared/lib/commitments/model";

const HIT_SLOP = { top: 12, bottom: 12, left: 12, right: 12 };
const QUICK_NAMES = ["Agua", "Celular", "Gimnasio", "Streaming", "Otro"] as const;

const DEFAULT_VALUES: CommitmentFormValues = {
	name: "",
	amountRaw: "",
	dueDay: "",
	envelope: "needs",
};

type Props = {
	isSubmitting?: boolean;
	formError?: string | null;
	onSubmit: (args: CreateCommitmentArgs) => void;
	onCancel: () => void;
};

export function CommitmentForm({ isSubmitting = false, formError, onSubmit, onCancel }: Props) {
	const [fieldError, setFieldError] = useState<{
		field: CommitmentField;
		message: string;
	} | null>(null);
	const form = useForm({
		defaultValues: DEFAULT_VALUES,
		onSubmit: ({ value }) => {
			const draft = toCreateCommitment(value);
			if (!draft.ok) {
				setFieldError({ field: draft.field, message: draft.message });
				return;
			}
			setFieldError(null);
			onSubmit(draft.args);
		},
	});

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
				)}
			</form.Field>
			{fieldError?.field === "name" ? <ErrorText message={fieldError.message} /> : null}

			<View className="mt-4 flex-row flex-wrap gap-2">
				{QUICK_NAMES.map((name) => (
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
				)}
			</form.Field>
			{fieldError?.field === "amount" ? <ErrorText message={fieldError.message} /> : null}

			<form.Field name="dueDay">
				{(field) => (
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
				)}
			</form.Field>
			{fieldError?.field === "dueDay" ? <ErrorText message={fieldError.message} /> : null}

			<Text className="mt-6 font-geist-mono text-[10.5px] tracking-[0.14em] text-foreground/55">
				SOBRE
			</Text>
			<form.Field name="envelope">
				{(field) => (
					<View className="mt-3">
						<EnvelopeChoices
							value={field.state.value}
							disabled={isSubmitting}
							onChange={(type) => {
								if (type === "needs" || type === "wants") {
									field.handleChange(type);
								}
							}}
						/>
					</View>
				)}
			</form.Field>

			{formError ? <ErrorText message={formError} /> : null}
			<Pressable
				accessibilityRole="button"
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

function ErrorText({ message }: { message: string }) {
	return <Text className="mt-2 font-hanken text-[13px] text-danger">{message}</Text>;
}
