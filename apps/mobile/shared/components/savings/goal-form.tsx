import { useForm, useStore } from "@tanstack/react-form";
import { Pressable, Text, TextInput, View } from "react-native";
import { readActionError } from "@/shared/lib/expenses/errors";
import { HIT_SLOP } from "@/shared/lib/hit-slop";
import {
	type CreateSavingsGoalArgs,
	type GoalFormValues,
	toCreateSavingsGoal,
} from "@/shared/lib/savings/model";

const DEFAULT_VALUES: GoalFormValues = {
	label: "",
	targetRaw: "",
};

type Props = {
	onSubmit: (args: CreateSavingsGoalArgs) => Promise<void>;
	onCancel: () => void;
};

export function GoalForm({ onSubmit, onCancel }: Props) {
	const form = useForm({
		defaultValues: DEFAULT_VALUES,
		validators: {
			onSubmit: ({ value }) => {
				const draft = toCreateSavingsGoal(value);
				if (!draft.ok) return { fields: draft.fields };
			},
		},
		onSubmit: async ({ value, formApi }) => {
			const draft = toCreateSavingsGoal(value);
			if (!draft.ok) return;
			try {
				await onSubmit(draft.args);
			} catch (error) {
				formApi.setErrorMap({
					onSubmit: {
						form: readActionError(error, "No se pudo crear la meta."),
						fields: {},
					},
				});
			}
		},
	});
	const isSubmitting = useStore(form.store, (state) => state.isSubmitting);
	const formError = useStore(form.store, (state) => {
		const error = state.errorMap.onSubmit;
		if (error && typeof error === "object" && "form" in error && typeof error.form === "string") {
			return error.form;
		}
		return null;
	});

	return (
		<View className="flex-1 px-[22px] pt-1.5 pb-8">
			<View className="flex-row items-center justify-between">
				<Text className="font-geist-mono text-[10.5px] uppercase tracking-[0.14em] text-foreground/55">
					NUEVA META
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

			<form.Field name="label">
				{(field) => (
					<View>
						<TextInput
							value={field.state.value}
							onChangeText={field.handleChange}
							onBlur={field.handleBlur}
							placeholder="Nombre de la meta"
							placeholderTextColor="#8C8880"
							maxLength={40}
							accessibilityLabel="Nombre de la meta"
							className="mt-6 border-b border-line pb-3 font-hanken text-[16px] text-foreground"
						/>
						<FieldError error={field.state.meta.errors[0]} />
					</View>
				)}
			</form.Field>

			<form.Field name="targetRaw">
				{(field) => (
					<View>
						<TextInput
							value={field.state.value}
							onChangeText={field.handleChange}
							onBlur={field.handleBlur}
							placeholder="Meta (opcional)"
							placeholderTextColor="#8C8880"
							keyboardType="decimal-pad"
							accessibilityLabel="Meta"
							className="mt-6 border-b border-line pb-3 font-hanken text-[16px] text-foreground"
						/>
						<FieldError error={field.state.meta.errors[0]} />
					</View>
				)}
			</form.Field>

			{formError ? <ErrorText message={formError} /> : null}
			<Pressable
				accessibilityRole="button"
				accessibilityLabel="Crear meta"
				accessibilityState={{ disabled: isSubmitting }}
				disabled={isSubmitting}
				onPress={() => void form.handleSubmit()}
				className={`mt-8 items-center rounded-[13px] bg-foreground py-4 active:opacity-80 ${
					isSubmitting ? "opacity-60" : ""
				}`}
			>
				<Text className="font-hanken-semibold text-[15px] text-background">
					{isSubmitting ? "Guardando…" : "Crear meta"}
				</Text>
			</Pressable>
		</View>
	);
}

function FieldError({ error }: { error: unknown }) {
	if (typeof error !== "string" || !error) return null;
	return <ErrorText message={error} />;
}

function ErrorText({ message }: { message: string }) {
	return <Text className="mt-2 font-hanken text-[13px] text-danger">{message}</Text>;
}
