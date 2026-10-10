import { useForm, useStore } from "@tanstack/react-form";
import { Pressable, Text, View } from "react-native";
import { ExpenseKeypad, KeypadAmount } from "@/shared/components/expenses/expense-keypad";
import { ErrorText } from "@/shared/components/forms/field-error";
import { ListRow } from "@/shared/components/list-row";
import { formatExpenseWhen } from "@/shared/lib/expenses/present";
import type { IncomeCycleOffer } from "@/shared/lib/income/cycle-offer";
import {
	defaultIncomeFormValues,
	type IncomeDraft,
	type IncomeKind,
	incomeDraftFromForm,
} from "@/shared/lib/income/draft";
import {
	EXTRA_COPY,
	type ExtraordinaryType,
	extraTypesFor,
	GENERIC_EXTRA,
} from "@/shared/lib/income/extra-types";
import type { IncomeModel } from "@/shared/lib/onboarding/types";

const HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 };
const CYCLE_CHOICES = [
	{
		kind: "habitual",
		testID: "income-mode-new-cycle",
		label: "Empieza un nuevo ciclo",
		hint: "Abre un período nuevo",
	},
	{
		kind: "extraordinary",
		testID: "income-mode-add",
		label: "Sumar al ciclo actual",
		hint: "Sin cerrar este período",
	},
] as const satisfies ReadonlyArray<{
	kind: IncomeKind;
	testID: string;
	label: string;
	hint: string;
}>;

type SheetCycle = Exclude<IncomeCycleOffer, "loading">;

function choicesFor(cycle: SheetCycle, startedToday: boolean) {
	if (startedToday) return CYCLE_CHOICES.filter((choice) => choice.kind === "extraordinary");
	if (cycle === "none") return CYCLE_CHOICES.filter((choice) => choice.kind === "habitual");
	return CYCLE_CHOICES;
}

/** Empezó hoy o sigue en curso: sumar. Vencido o sin ciclo: empezar uno nuevo. */
function initialIncomeKind(cycle: SheetCycle, startedToday: boolean): IncomeKind {
	if (startedToday || cycle === "open") return "extraordinary";
	return "habitual";
}

/** Si solo hay una opción, el valor sale de esa opción en el render. */
function resolveIncomeKind(
	cycle: SheetCycle,
	startedToday: boolean,
	chosen: IncomeKind,
): IncomeKind {
	if (startedToday) return "extraordinary";
	if (cycle === "none") return "habitual";
	return chosen;
}

/** Un tipo que ya no se ofrece (el perfil cargó después) vuelve al genérico. */
function resolveExtraType(
	offered: readonly ExtraordinaryType[],
	chosen: ExtraordinaryType,
): ExtraordinaryType {
	return offered.includes(chosen) ? chosen : GENERIC_EXTRA;
}

type Props = {
	currencySymbol: string;
	formError?: string | null;
	cycle: SheetCycle;
	/** getSummary.cycle.startedToday: hoy solo se suma al ciclo en curso. */
	startedToday?: boolean;
	/** Define qué extraordinarios se ofrecen; sin perfil cargado solo el genérico. */
	incomeModel?: IncomeModel | null;
	onSubmit: (draft: IncomeDraft) => Promise<unknown>;
	onCancel: () => void;
};

export function IncomeSheetForm({
	currencySymbol,
	formError,
	cycle,
	startedToday = false,
	incomeModel,
	onSubmit,
	onCancel,
}: Props) {
	const choices = choicesFor(cycle, startedToday);
	const extraTypes = extraTypesFor(incomeModel);
	const form = useForm({
		defaultValues: {
			...defaultIncomeFormValues(),
			incomeKind: initialIncomeKind(cycle, startedToday),
		},
		onSubmit: ({ value }) =>
			onSubmit(
				incomeDraftFromForm({
					...value,
					incomeKind: resolveIncomeKind(cycle, startedToday, value.incomeKind),
					extraordinaryType: resolveExtraType(extraTypes, value.extraordinaryType),
				}),
			),
	});
	const amountCents = useStore(form.store, (state) => state.values.amountCents);
	const occurredAt = useStore(form.store, (state) => state.values.occurredAt);
	const incomeKind = useStore(form.store, (state) =>
		resolveIncomeKind(cycle, startedToday, state.values.incomeKind),
	);
	const extraType = useStore(form.store, (state) =>
		resolveExtraType(extraTypes, state.values.extraordinaryType),
	);
	const asksExtraType = incomeKind === "extraordinary" && extraTypes.length > 1;
	const submitLabel =
		incomeKind === "extraordinary" ? EXTRA_COPY[extraType].submit : "Registrar ingreso";

	return (
		<View testID="income-sheet" className="px-[22px] pb-8">
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
					const kind = resolveIncomeKind(cycle, startedToday, field.state.value);
					return (
						<View className="mt-4 gap-2">
							{choices.map((option) => {
								const selected = kind === option.kind;
								return (
									<Pressable
										key={option.kind}
										testID={option.testID}
										accessibilityRole="button"
										accessibilityLabel={option.label}
										accessibilityHint={option.hint}
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

			{asksExtraType ? (
				<View testID="income-extra-types" className="mt-4 gap-2">
					<Text className="font-geist-mono text-[10.5px] uppercase tracking-[0.14em] text-foreground/55">
						¿QUÉ RECIBISTE?
					</Text>
					<View className="flex-row flex-wrap gap-2">
						{extraTypes.map((type) => {
							const selected = extraType === type;
							return (
								<Pressable
									key={type}
									testID={`income-extra-${type}`}
									accessibilityRole="button"
									accessibilityLabel={EXTRA_COPY[type].title}
									accessibilityState={{ selected }}
									onPress={() => form.setFieldValue("extraordinaryType", type)}
									className={`rounded-full border px-3.5 py-2 active:opacity-60 ${
										selected ? "border-primary bg-primary/5" : "border-line"
									}`}
								>
									<Text
										className={`text-[13px] text-foreground ${
											selected ? "font-hanken-semibold" : "font-hanken"
										}`}
									>
										{EXTRA_COPY[type].chip}
									</Text>
								</Pressable>
							);
						})}
					</View>
				</View>
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
						testID="income-submit"
						accessibilityRole="button"
						accessibilityState={{ disabled: isSubmitting }}
						disabled={isSubmitting}
						onPress={() => form.handleSubmit()}
						className={`mt-2 items-center rounded-[13px] bg-primary py-4 active:opacity-80 ${
							isSubmitting ? "opacity-60" : ""
						}`}
					>
						<Text className="font-hanken-semibold text-[15px] text-background">
							{isSubmitting ? "Guardando…" : submitLabel}
						</Text>
					</Pressable>
				)}
			</form.Subscribe>
		</View>
	);
}
