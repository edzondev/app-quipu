import { useForm, useSelector } from "@tanstack/react-form";
import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { z } from "zod";
import {
	consumeNotification,
	type PendingNotification,
} from "@/modules/quipu-notification-listener";
import { ErrorText, FieldError } from "@/shared/components/forms/field-error";
import { SectionLabel } from "@/shared/components/section-label";
import { useExpenseActions } from "@/shared/hooks/use-expense-actions";
import { centsToAmountRaw } from "@/shared/lib/expenses/amount";
import {
	EXPENSE_DESCRIPTION_MAX,
	type ExpenseDraftInput,
	validateExpenseDraft,
} from "@/shared/lib/expenses/draft";
import { readActionError } from "@/shared/lib/expenses/errors";
import { formErrorMessage, setFormError } from "@/shared/lib/form";
import { HIT_SLOP } from "@/shared/lib/hit-slop";
import { EnvelopeChoices } from "./envelope-choices";

const detectedExpenseSchema = z
	.object({
		amountRaw: z.string(),
		description: z.string(),
		envelopeType: z.enum(["needs", "wants", "savings"]).nullable(),
	})
	.superRefine((value, ctx) => {
		const parsed = validateExpenseDraft(value);
		if (parsed.ok) return;
		ctx.addIssue({
			code: "custom",
			path: [parsed.error.field],
			message: parsed.error.message,
		});
	});

type Props = {
	item: PendingNotification;
	bankName: string;
	onClose: () => void;
};

export function DetectedExpenseSheet({ item, bankName, onClose }: Props) {
	const { register } = useExpenseActions();
	const [discarding, setDiscarding] = useState(false);
	const [discardError, setDiscardError] = useState<string | null>(null);
	const defaultValues: ExpenseDraftInput = {
		amountRaw: item.amountCents == null ? "" : centsToAmountRaw(item.amountCents),
		description: bankName,
		envelopeType: null,
	};
	const form = useForm({
		defaultValues,
		validators: { onSubmit: detectedExpenseSchema },
		onSubmit: async ({ value, formApi }) => {
			try {
				await register(value, item.id);
				await consumeNotification(item.id);
				onClose();
			} catch (error) {
				setFormError(formApi, readActionError(error, "No se pudo guardar el gasto."));
			}
		},
	});
	const isSubmitting = useSelector(form.store, (state) => state.isSubmitting);
	const formError = useSelector(form.store, (state) => formErrorMessage(state.errorMap.onSubmit));
	const busy = isSubmitting || discarding;

	async function discard() {
		if (busy) return;
		setDiscarding(true);
		setDiscardError(null);
		try {
			await consumeNotification(item.id);
			onClose();
		} catch (error) {
			setDiscardError(readActionError(error, "No se pudo descartar el gasto."));
			setDiscarding(false);
		}
	}

	return (
		<ScrollView
			testID="detected-expense-sheet"
			keyboardShouldPersistTaps="handled"
			className="flex-1 bg-background"
			contentContainerClassName="px-[22px] pt-6 pb-8"
		>
			<SectionLabel>Gasto detectado</SectionLabel>
			<form.Field name="amountRaw">
				{(field) => (
					<View>
						<View className="mt-5 flex-row items-end gap-2 border-b border-line pb-2">
							<Text className="mb-1 font-newsreader text-[22px] text-foreground/55">S/</Text>
							<TextInput
								value={field.state.value}
								onChangeText={field.handleChange}
								onBlur={field.handleBlur}
								keyboardType="decimal-pad"
								placeholder="0.00"
								placeholderTextColorClassName="accent-foreground/45"
								accessibilityLabel="Monto"
								editable={!busy}
								className="min-w-0 flex-1 font-newsreader text-[40px] text-foreground"
							/>
						</View>
						<FieldError field={field} />
					</View>
				)}
			</form.Field>
			<form.Field name="description">
				{(field) => (
					<View className="mt-5">
						<TextInput
							value={field.state.value}
							onChangeText={field.handleChange}
							onBlur={field.handleBlur}
							placeholder="Descripción"
							placeholderTextColorClassName="accent-foreground/45"
							maxLength={EXPENSE_DESCRIPTION_MAX}
							accessibilityLabel="Descripción"
							editable={!busy}
							className="border-b border-line pb-3 font-hanken text-[16px] text-foreground"
						/>
						<FieldError field={field} />
					</View>
				)}
			</form.Field>
			<SectionLabel className="mt-6">Va al sobre</SectionLabel>
			<form.Field name="envelopeType">
				{(field) => (
					<View className="mt-3">
						<EnvelopeChoices
							value={field.state.value}
							disabled={busy}
							onChange={field.handleChange}
						/>
						<FieldError field={field} />
					</View>
				)}
			</form.Field>
			{formError ? <ErrorText message={formError} /> : null}
			{discardError ? <ErrorText message={discardError} /> : null}
			<Pressable
				accessibilityRole="button"
				accessibilityLabel="Guardar"
				accessibilityState={{ disabled: busy }}
				disabled={busy}
				onPress={() => {
					void form.handleSubmit();
				}}
				className={`mt-6 items-center rounded-[13px] bg-foreground py-4 active:opacity-80 ${
					busy ? "opacity-60" : ""
				}`}
			>
				<Text className="font-hanken-semibold text-[15px] text-background">
					{isSubmitting ? "Guardando…" : "Guardar"}
				</Text>
			</Pressable>
			<Pressable
				accessibilityRole="button"
				accessibilityLabel="Descartar"
				accessibilityState={{ disabled: busy }}
				disabled={busy}
				hitSlop={HIT_SLOP}
				onPress={() => {
					void discard();
				}}
				className="mt-3 items-center py-3 active:opacity-60"
			>
				<Text className="font-hanken-semibold text-[15px] text-foreground/55">Descartar</Text>
			</Pressable>
		</ScrollView>
	);
}
