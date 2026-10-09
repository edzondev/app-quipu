import { useForm, useStore } from "@tanstack/react-form";
import { Pressable, Text, View } from "react-native";
import { ExpenseKeypad, KeypadAmount } from "@/shared/components/expenses/expense-keypad";
import { ErrorText } from "@/shared/components/forms/field-error";
import { ListRow } from "@/shared/components/list-row";
import { formatExpenseWhen } from "@/shared/lib/expenses/present";
import { defaultIncomeDraft, type IncomeDraft, type IncomeKind } from "@/shared/lib/income/draft";

const HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 };
const NO_CYCLE_COPY = "Tu sueldo empieza un ciclo nuevo";
const INCOME_KINDS = [
	{ kind: "habitual", label: "Sueldo" },
	{ kind: "extraordinary", label: "Extra" },
] as const satisfies ReadonlyArray<{ kind: IncomeKind; label: string }>;

type Props = {
	currencySymbol: string;
	formError?: string | null;
	hasActiveCycle: boolean;
	onSubmit: (draft: IncomeDraft) => Promise<unknown>;
	onCancel: () => void;
};

export function IncomeSheetForm({
	currencySymbol,
	formError,
	hasActiveCycle,
	onSubmit,
	onCancel,
}: Props) {
	const kinds = hasActiveCycle
		? INCOME_KINDS
		: INCOME_KINDS.filter((option) => option.kind === "habitual");
	const form = useForm({
		defaultValues: defaultIncomeDraft(),
		onSubmit: ({ value }) =>
			onSubmit({
				...value,
				incomeKind: hasActiveCycle ? value.incomeKind : "habitual",
			}),
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

			<form.Field name="incomeKind">
				{(field) => (
					<View className="mt-4 gap-2">
						<View className="flex-row gap-2">
							{kinds.map((option) => {
								const selected = field.state.value === option.kind;
								return (
									<Pressable
										key={option.kind}
										accessibilityRole="button"
										accessibilityLabel={option.label}
										accessibilityState={{ selected }}
										onPress={() => field.handleChange(option.kind)}
										className={`flex-1 items-center rounded-full border px-3 py-2.5 active:opacity-60 ${
											selected ? "border-primary bg-primary/5" : "border-line"
										}`}
									>
										<Text
											className={
												selected
													? "font-hanken-semibold text-[13px] text-foreground"
													: "font-hanken text-[13px] text-foreground/55"
											}
										>
											{option.label}
										</Text>
									</Pressable>
								);
							})}
						</View>
						{hasActiveCycle ? null : (
							<Text className="font-hanken text-[13px] text-foreground/55">{NO_CYCLE_COPY}</Text>
						)}
					</View>
				)}
			</form.Field>

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
