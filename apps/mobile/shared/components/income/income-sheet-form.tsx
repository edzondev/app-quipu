import { useForm, useStore } from "@tanstack/react-form";
import { Pressable, Text, View } from "react-native";
import { ExpenseKeypad, KeypadAmount } from "@/shared/components/expenses/expense-keypad";
import { ErrorText } from "@/shared/components/forms/field-error";
import { ListRow } from "@/shared/components/list-row";
import { formatExpenseWhen } from "@/shared/lib/expenses/present";
import { type IncomeCycleOffer } from "@/shared/lib/income/cycle-offer";
import { defaultIncomeDraft, type IncomeDraft, type IncomeKind } from "@/shared/lib/income/draft";

const HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 };
const CYCLE_CHOICES = [
	{
		kind: "habitual",
		label: "Empieza un nuevo ciclo",
		hint: "Abre un período nuevo",
	},
	{
		kind: "extraordinary",
		label: "Sumar al ciclo actual",
		hint: "Sin cerrar este período",
	},
] as const satisfies ReadonlyArray<{ kind: IncomeKind; label: string; hint: string }>;

type SheetCycle = Exclude<IncomeCycleOffer, "loading">;

function choicesFor(cycle: SheetCycle) {
	if (cycle === "none") return CYCLE_CHOICES.filter((choice) => choice.kind === "habitual");
	return CYCLE_CHOICES;
}

/** Ciclo en curso: sumar. Vencido o sin ciclo: empezar uno nuevo. */
function initialIncomeKind(cycle: SheetCycle): IncomeKind {
	return cycle === "open" ? "extraordinary" : "habitual";
}

/** Si solo hay una opción, el valor sale de esa opción en el render. */
function resolveIncomeKind(cycle: SheetCycle, chosen: IncomeKind): IncomeKind {
	if (cycle === "none") return "habitual";
	return chosen;
}

type Props = {
	currencySymbol: string;
	formError?: string | null;
	cycle: SheetCycle;
	onSubmit: (draft: IncomeDraft) => Promise<unknown>;
	onCancel: () => void;
};

export function IncomeSheetForm({ currencySymbol, formError, cycle, onSubmit, onCancel }: Props) {
	const choices = choicesFor(cycle);
	const form = useForm({
		defaultValues: { ...defaultIncomeDraft(), incomeKind: initialIncomeKind(cycle) },
		onSubmit: ({ value }) =>
			onSubmit({
				...value,
				incomeKind: resolveIncomeKind(cycle, value.incomeKind),
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
				{(field) => {
					const kind = resolveIncomeKind(cycle, field.state.value);
					return (
						<View className="mt-4 gap-2">
							{choices.map((option) => {
								const selected = kind === option.kind;
								return (
									<Pressable
										key={option.kind}
										accessibilityRole="button"
										accessibilityLabel={option.label}
										accessibilityState={{ selected }}
										onPress={() => field.handleChange(option.kind)}
										className={`rounded-[13px] border px-3.5 py-3 active:opacity-60 ${
											selected ? "border-primary bg-primary/5" : "border-line"
										}`}
									>
										<Text
											className={`text-[14px] text-foreground ${
												selected ? "font-hanken-semibold" : "font-hanken"
											}`}
										>
											{option.label}
										</Text>
										<Text className="mt-0.5 font-hanken text-[12px] text-foreground/45">
											{option.hint}
										</Text>
									</Pressable>
								);
							})}
						</View>
					);
				}}
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
