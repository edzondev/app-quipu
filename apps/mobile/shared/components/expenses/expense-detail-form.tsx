import { useForm, useStore } from "@tanstack/react-form";
import type { ReactNode } from "react";
import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Camera } from "reicon-react-native/icons/Camera";
import { ChevronLeft } from "reicon-react-native/icons/ChevronLeft";
import { ChevronRight } from "reicon-react-native/icons/ChevronRight";
import { ErrorText } from "@/shared/components/forms/field-error";
import { HIDDEN_UNTIL_READY } from "@/shared/hidden-until-ready";
import type { ExpenseDraftInput, ExpenseField } from "@/shared/lib/expenses/draft";
import type { FrequentExpense } from "@/shared/lib/expenses/expense-record";
import { formatKeypadAmount } from "@/shared/lib/expenses/keypad";
import {
	detailRemainingLabel,
	formatExpenseWhen,
	frequentChipLabel,
	previewCents,
	remainingAfterExpense,
} from "@/shared/lib/expenses/present";
import { EnvelopeChoices, envelopeChoiceLabel } from "./envelope-choices";

const HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 };

const ENVELOPE_DOT = {
	needs: "bg-needs",
	wants: "bg-wants",
	savings: "bg-savings",
} as const;

type Props = {
	mode: "create" | "edit";
	currencySymbol: string;
	dailyCents: number | null;
	previousAmountCents: number;
	initial: ExpenseDraftInput;
	timestamp: number;
	frecuentes: FrequentExpense[];
	fieldError?: { field: ExpenseField; message: string } | null;
	formError?: string | null;
	isSubmitting?: boolean;
	onSubmit: (input: ExpenseDraftInput) => void;
	onBack: () => void;
	onDelete?: () => void;
};

export function ExpenseDetailForm({
	mode,
	currencySymbol,
	dailyCents,
	previousAmountCents,
	initial,
	timestamp,
	frecuentes,
	fieldError,
	formError,
	isSubmitting = false,
	onSubmit,
	onBack,
	onDelete,
}: Props) {
	const form = useForm({
		defaultValues: initial,
		onSubmit: ({ value }) => onSubmit(value),
	});
	const amountRaw = useStore(form.store, (state) => state.values.amountRaw);
	const envelopeType = useStore(form.store, (state) => state.values.envelopeType);
	const [envelopeOpen, setEnvelopeOpen] = useState(false);
	const remaining =
		dailyCents == null
			? null
			: remainingAfterExpense(dailyCents, previewCents(amountRaw), previousAmountCents);

	return (
		<View className="flex-1">
			<ScrollView
				className="flex-1"
				keyboardShouldPersistTaps="handled"
				contentContainerClassName="px-[22px] pb-6"
				showsVerticalScrollIndicator={false}
			>
				<View className="flex-row items-center justify-between">
					<Pressable
						accessibilityRole="button"
						accessibilityLabel="Volver"
						hitSlop={HIT_SLOP}
						onPress={onBack}
					>
						<ChevronLeft size={22} color="#1A1A1A" />
					</Pressable>
					<Text className="font-geist-mono text-[10.5px] uppercase tracking-[0.14em] text-foreground/55">
						{mode === "edit" ? "EDITAR GASTO" : "REGISTRAR GASTO"}
					</Text>
					<View className="w-[22px]" />
				</View>

				<View className="mt-8 items-center">
					<View className="flex-row items-baseline justify-center gap-2">
						<Text className="font-newsreader text-[24px] text-foreground/55">{currencySymbol}</Text>
						<form.Field name="amountRaw">
							{(field) => (
								<TextInput
									testID="expense-amount"
									value={field.state.value}
									onChangeText={field.handleChange}
									onBlur={field.handleBlur}
									keyboardType="decimal-pad"
									accessibilityLabel="Monto"
									className="min-w-[140px] font-newsreader text-[68px] leading-[76px] tracking-tight text-foreground"
								/>
							)}
						</form.Field>
					</View>
					{remaining == null ? null : (
						<Text className="mt-3.5 font-geist-mono text-[12.5px] uppercase text-foreground/45">
							{detailRemainingLabel(remaining, currencySymbol)}
						</Text>
					)}
				</View>
				{fieldError?.field === "amount" ? <ErrorText message={fieldError.message} /> : null}

				<View className="mt-8">
					<DetailRow label="Comercio">
						<form.Field name="description">
							{(field) => (
								<TextInput
									value={field.state.value}
									onChangeText={field.handleChange}
									onBlur={field.handleBlur}
									placeholder="Opcional"
									placeholderTextColor="#8C8880"
									maxLength={120}
									accessibilityLabel="Comercio"
									className="min-w-[140px] flex-1 text-right font-hanken-semibold text-[15.5px] text-foreground"
								/>
							)}
						</form.Field>
					</DetailRow>
					{fieldError?.field === "description" ? <ErrorText message={fieldError.message} /> : null}

					<DetailRow label="Sobre">
						<Pressable
							accessibilityRole="button"
							accessibilityLabel="Cambiar sobre"
							hitSlop={HIT_SLOP}
							className="flex-row items-center gap-2"
							onPress={() => setEnvelopeOpen((open) => !open)}
						>
							{envelopeType ? (
								<View className={`h-[7px] w-[7px] rounded-full ${ENVELOPE_DOT[envelopeType]}`} />
							) : null}
							<Text className="font-hanken-semibold text-[15.5px] text-foreground">
								{envelopeChoiceLabel(envelopeType)}
							</Text>
							<ChevronRight size={16} color="#9A968C" />
						</Pressable>
					</DetailRow>
					{envelopeOpen ? (
						<View className="py-3">
							<EnvelopeChoices
								value={envelopeType}
								disabled={isSubmitting}
								onChange={(type) => {
									form.setFieldValue("envelopeType", type);
									setEnvelopeOpen(false);
								}}
							/>
						</View>
					) : null}
					{fieldError?.field === "envelopeType" ? <ErrorText message={fieldError.message} /> : null}

					<DetailRow label="Fecha">
						<Text className="font-hanken-semibold text-[15.5px] text-foreground">
							{formatExpenseWhen(timestamp)}
						</Text>
					</DetailRow>
					{HIDDEN_UNTIL_READY.expenseNote ? null : (
						<DetailRow label="Nota">
							<Text className="font-hanken text-[15.5px] text-foreground/35">Opcional</Text>
						</DetailRow>
					)}
				</View>

				{frecuentes.length > 0 ? (
					<View className="mt-5">
						<Text className="font-geist-mono text-[10.5px] uppercase tracking-[0.14em] text-foreground/55">
							FRECUENTES
						</Text>
						<View className="mt-3 flex-row flex-wrap gap-2">
							{frecuentes.map((chip) => (
								<Pressable
									key={chip.id}
									accessibilityRole="button"
									onPress={() => {
										form.setFieldValue("description", chip.label);
										form.setFieldValue("amountRaw", formatKeypadAmount(chip.amountCents));
									}}
									className="rounded-full border border-line px-3.5 py-[9px]"
								>
									<Text className="font-hanken text-[13px] text-foreground">
										{frequentChipLabel(chip.label, chip.amountCents)}
									</Text>
								</Pressable>
							))}
						</View>
					</View>
				) : null}

				{HIDDEN_UNTIL_READY.attachReceipt ? null : (
					<View className="mt-5 flex-row items-center gap-2.5 rounded-[13px] bg-foreground/5 px-4 py-3.5">
						<Camera size={19} color="#3C7D6E" />
						<Text className="font-hanken-semibold text-[13.5px] text-foreground">
							Adjuntar boleta
						</Text>
						<Text className="ml-auto font-geist-mono text-[11.5px] text-foreground/45">OCR</Text>
					</View>
				)}
			</ScrollView>

			<View className="px-[22px] pb-2">
				{formError ? <ErrorText message={formError} /> : null}
				<Pressable
					testID="expense-save"
					accessibilityRole="button"
					disabled={isSubmitting}
					onPress={() => void form.handleSubmit()}
					className={`items-center rounded-[13px] bg-foreground py-4 ${
						isSubmitting ? "opacity-60" : ""
					}`}
				>
					<Text className="font-hanken-semibold text-[15px] text-background">
						{isSubmitting ? "Guardando…" : mode === "edit" ? "Guardar" : "Registrar gasto"}
					</Text>
				</Pressable>
				{onDelete ? (
					<Pressable
						testID="expense-delete"
						accessibilityRole="button"
						hitSlop={HIT_SLOP}
						onPress={onDelete}
						className="items-center py-3"
					>
						<Text className="font-hanken-semibold text-[15px] text-danger">Eliminar</Text>
					</Pressable>
				) : null}
			</View>
		</View>
	);
}

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
	return (
		<View className="flex-row items-center justify-between border-b border-line py-[15px]">
			<Text className="font-hanken text-[13.5px] text-foreground/45">{label}</Text>
			{children}
		</View>
	);
}
