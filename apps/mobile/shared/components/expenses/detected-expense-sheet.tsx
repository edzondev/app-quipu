import { useForm, useSelector } from "@tanstack/react-form";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { z } from "zod";
import { ErrorText, FieldError } from "@/shared/components/forms/field-error";
import { SectionLabel } from "@/shared/components/section-label";
import { useExpenseActions } from "@/shared/hooks/use-expense-actions";
import { centsToAmountRaw } from "@/shared/lib/expenses/amount";
import {
	type DetectedNoticePrefill,
	formatDetectedWhen,
} from "@/shared/lib/expenses/detected-notice";
import {
	EXPENSE_DESCRIPTION_MAX,
	type ExpenseDraftInput,
	validateExpenseDraft,
} from "@/shared/lib/expenses/draft";
import { readActionError } from "@/shared/lib/expenses/errors";
import { formErrorMessage, setFormError } from "@/shared/lib/form";
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
	notice: DetectedNoticePrefill;
	onClose: () => void;
};

export function DetectedExpenseSheet({ notice, onClose }: Props) {
	const { register } = useExpenseActions();
	const amountRaw = notice.amountCents == null ? "" : centsToAmountRaw(notice.amountCents);
	const when = formatDetectedWhen(notice.postedAt);
	const meta = [notice.bank, when].filter((part) => part.length > 0).join(" · ");
	const defaultValues: ExpenseDraftInput = {
		amountRaw,
		description: notice.merchant,
		envelopeType: null,
	};
	const form = useForm({
		defaultValues,
		validators: { onSubmit: detectedExpenseSchema },
		onSubmit: async ({ value, formApi }) => {
			try {
				await register(value, notice.id);
				onClose();
			} catch (error) {
				setFormError(formApi, readActionError(error, "No se pudo guardar el gasto."));
			}
		},
	});
	const isSubmitting = useSelector(form.store, (state) => state.isSubmitting);
	const formError = useSelector(form.store, (state) => formErrorMessage(state.errorMap.onSubmit));

	return (
		<ScrollView
			testID="detected-expense-sheet"
			keyboardShouldPersistTaps="handled"
			className="flex-1"
			contentContainerClassName="px-[22px] pt-6 pb-8"
		>
			<SectionLabel>Gasto detectado</SectionLabel>
			{meta.length > 0 ? (
				<Text className="mt-2 font-geist-mono text-[12px] text-foreground/55">{meta}</Text>
			) : null}
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
								autoFocus={amountRaw.length === 0}
								editable={!isSubmitting}
								className="min-h-11 min-w-0 flex-1 font-newsreader text-[40px] text-foreground"
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
							placeholder="Comercio"
							placeholderTextColorClassName="accent-foreground/45"
							maxLength={EXPENSE_DESCRIPTION_MAX}
							accessibilityLabel="Comercio"
							editable={!isSubmitting}
							className="min-h-11 border-b border-line pb-3 font-hanken text-[16px] text-foreground"
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
							disabled={isSubmitting}
							onChange={field.handleChange}
						/>
						<FieldError field={field} />
					</View>
				)}
			</form.Field>
			{formError ? <ErrorText message={formError} /> : null}
			<Pressable
				accessibilityRole="button"
				accessibilityLabel="Registrar gasto"
				accessibilityState={{ disabled: isSubmitting }}
				disabled={isSubmitting}
				onPress={() => {
					void form.handleSubmit();
				}}
				className={`mt-6 min-h-11 items-center justify-center rounded-[13px] bg-foreground py-4 active:opacity-80 ${
					isSubmitting ? "opacity-60" : ""
				}`}
			>
				<Text className="font-hanken-semibold text-[15px] text-background">
					{isSubmitting ? "Guardando…" : "Registrar gasto"}
				</Text>
			</Pressable>
			<Pressable
				accessibilityRole="button"
				accessibilityLabel="Cerrar"
				accessibilityState={{ disabled: isSubmitting }}
				disabled={isSubmitting}
				onPress={onClose}
				className="mt-2 min-h-11 items-center justify-center active:opacity-60"
			>
				<Text className="font-hanken-semibold text-[15px] text-foreground/55">Cerrar</Text>
			</Pressable>
		</ScrollView>
	);
}
