import { useForm, useStore } from "@tanstack/react-form";
import { Pressable, Text, View } from "react-native";
import { ExpenseKeypad, KeypadAmount } from "@/shared/components/expenses/expense-keypad";
import { ErrorText } from "@/shared/components/forms/field-error";
import { ListRow } from "@/shared/components/list-row";
import { formatExpenseWhen } from "@/shared/lib/expenses/present";
import { defaultIncomeDraft, type IncomeDraft } from "@/shared/lib/income/draft";

const HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 };

type Props = {
	currencySymbol: string;
	formError?: string | null;
	initialAmountCents?: number;
	prompt?: string;
	onSubmit: (draft: IncomeDraft) => Promise<unknown>;
	onCancel: () => void;
};

export function IncomeSheetForm({
	currencySymbol,
	formError,
	initialAmountCents = 0,
	prompt,
	onSubmit,
	onCancel,
}: Props) {
	const form = useForm({
		defaultValues: { ...defaultIncomeDraft(), amountCents: initialAmountCents },
		onSubmit: ({ value }) => onSubmit(value),
	});
	const amountCents = useStore(form.store, (state) => state.values.amountCents);
	const occurredAt = useStore(form.store, (state) => state.values.occurredAt);

	return (
		<View className="flex-1 px-[22px] pb-8">
			<View className="mt-4 flex-row items-center justify-between">
				<Text className="font-geist-mono text-[10.5px] uppercase tracking-[0.14em] text-foreground/55">
					REGISTRAR INGRESO
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

			{prompt ? (
				<Text className="mt-4 font-hanken text-[15px] text-foreground">{prompt}</Text>
			) : null}

			<View className="mt-5">
				<KeypadAmount currencySymbol={currencySymbol} cents={amountCents} />
			</View>

			<ListRow
				label="Fecha"
				value={formatExpenseWhen(occurredAt)}
				valueClass="font-hanken-semibold text-foreground"
				isLast
			/>

			<View className="mt-2">
				<ExpenseKeypad
					amountCents={amountCents}
					onAmountChange={(cents) => form.setFieldValue("amountCents", cents)}
				/>
			</View>

			{formError ? <ErrorText message={formError} /> : null}
			<form.Subscribe selector={(state) => state.isSubmitting}>
				{(isSubmitting) => (
					<Pressable
						accessibilityRole="button"
						accessibilityState={{ disabled: isSubmitting }}
						disabled={isSubmitting}
						onPress={() => form.handleSubmit()}
						className={`mt-2 items-center rounded-[13px] bg-primary py-4 active:opacity-80 ${
							isSubmitting ? "opacity-60" : ""
						}`}
					>
						<Text className="font-hanken-semibold text-[15px] text-background">
							{isSubmitting ? "Guardando…" : "Registrar ingreso"}
						</Text>
					</Pressable>
				)}
			</form.Subscribe>
		</View>
	);
}
