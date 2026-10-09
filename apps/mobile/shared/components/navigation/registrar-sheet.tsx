import { BottomSheet, RNHostView } from "@expo/ui";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { ExpenseSheetForm } from "@/shared/components/expenses/expense-sheet-form";
import { IncomeSheetForm } from "@/shared/components/income/income-sheet-form";
import { useHomeModel } from "@/shared/hooks/use-dashboard";
import { useExpenseActions } from "@/shared/hooks/use-expense-actions";
import { useIncomeActions } from "@/shared/hooks/use-income-actions";
import { useProfileGate } from "@/shared/hooks/use-profile-gate";
import type { ExpenseDraftInput } from "@/shared/lib/expenses/draft";
import { ExpenseValidationError } from "@/shared/lib/expenses/draft";
import { readActionError } from "@/shared/lib/expenses/errors";
import {
	type RegistrarIntent,
	type RegistrarMode,
	resolveRegistrarMode,
} from "@/shared/lib/navigation/registrar-mode";
import { marketFromCurrencyCode } from "@/shared/lib/onboarding/markets";

type Session = {
	nonce: number;
	intent: RegistrarIntent;
	incomeAmountCents?: number;
	incomePrompt?: string;
};

type Props = {
	isPresented: boolean;
	session: Session;
	onDismiss: () => void;
};

export default function RegistrarSheet({ isPresented, session, onDismiss }: Props) {
	return (
		<BottomSheet
			isPresented={isPresented}
			onDismiss={onDismiss}
			snapPoints={["full"]}
			contentPadding={0}
			containerColor="#FBFAF7"
		>
			<RNHostView>
				<SheetBody key={session.nonce} session={session} onDone={onDismiss} />
			</RNHostView>
		</BottomSheet>
	);
}

function SheetBody({ session, onDone }: { session: Session; onDone: () => void }) {
	const router = useRouter();
	const { register } = useExpenseActions();
	const { register: registerIncome } = useIncomeActions();
	const home = useHomeModel();
	const { profile } = useProfileGate();
	const noCycle = home.status === "empty";
	const hasCycle = home.status === "ready";
	const [picked, setPicked] = useState<RegistrarMode | null>(null);
	const forcedIncome = session.incomePrompt != null;
	const mode = forcedIncome
		? "income"
		: home.status === "loading"
			? null
			: noCycle
				? "income"
				: (picked ?? resolveRegistrarMode(session.intent, hasCycle));
	const [fieldError, setFieldError] = useState<{
		field: ExpenseValidationError["field"];
		message: string;
	} | null>(null);
	const [formError, setFormError] = useState<string | null>(null);
	const [isSubmitting, setSubmitting] = useState(false);
	const currencySymbol =
		home.status === "ready"
			? home.home.currencySymbol
			: (marketFromCurrencyCode(
					profile && typeof profile.currencyCode === "string" ? profile.currencyCode : "",
				)?.currencySymbol ?? "S/");
	const dailyCents = home.status === "ready" ? home.home.dailyCents : null;

	async function guard(work: () => Promise<unknown>, fallback: string) {
		setFieldError(null);
		setFormError(null);
		setSubmitting(true);
		try {
			await work();
			onDone();
		} catch (error) {
			if (error instanceof ExpenseValidationError) {
				setFieldError({ field: error.field, message: error.message });
			} else {
				setFormError(readActionError(error, fallback));
			}
		} finally {
			setSubmitting(false);
		}
	}

	function openDetail(input: ExpenseDraftInput) {
		if (noCycle) return;
		const query = new URLSearchParams({
			amountRaw: input.amountRaw,
			description: input.description,
			envelopeType: input.envelopeType ?? "",
		});
		onDone();
		router.push(`/expense/new?${query.toString()}`);
	}

	if (mode == null) {
		return (
			<View className="flex-1 items-center justify-center">
				<Text className="font-hanken text-[15px] text-foreground/55">Cargando…</Text>
			</View>
		);
	}

	return (
		<View className="flex-1">
			<View className="px-[22px] pt-1.5">
				<ModeSwitch
					value={mode}
					expenseDisabled={noCycle || forcedIncome}
					onChange={(next) => {
						if ((noCycle || forcedIncome) && next === "expense") return;
						setPicked(next);
						setFieldError(null);
						setFormError(null);
					}}
				/>
			</View>
			{mode === "income" ? (
				<IncomeSheetForm
					currencySymbol={currencySymbol}
					formError={formError}
					initialAmountCents={session.incomeAmountCents}
					prompt={session.incomePrompt}
					onSubmit={(draft) => guard(() => registerIncome(draft), "No se pudo guardar el ingreso.")}
					onCancel={onDone}
				/>
			) : (
				<ExpenseSheetForm
					currencySymbol={currencySymbol}
					dailyCents={dailyCents}
					fieldError={fieldError}
					formError={formError}
					isSubmitting={isSubmitting}
					onSubmit={(input) => void guard(() => register(input), "No se pudo guardar el gasto.")}
					onCancel={onDone}
					onOpenDetail={openDetail}
				/>
			)}
		</View>
	);
}

const MODES = [
	["expense", "Gasto"],
	["income", "Ingreso"],
] as const;

function ModeSwitch({
	value,
	expenseDisabled,
	onChange,
}: {
	value: RegistrarMode;
	expenseDisabled: boolean;
	onChange: (mode: RegistrarMode) => void;
}) {
	return (
		<View className="flex-row rounded-xl bg-foreground/5 p-1">
			{MODES.map(([id, label]) => {
				const selected = value === id;
				const disabled = id === "expense" && expenseDisabled;
				const tone = selected
					? "font-hanken-semibold text-[13.5px] text-foreground"
					: "font-hanken text-[13.5px] text-foreground/45";
				return (
					<Pressable
						key={id}
						accessibilityRole="button"
						accessibilityState={{ selected, disabled }}
						disabled={disabled}
						onPress={() => {
							if (disabled) return;
							onChange(id);
						}}
						className={`flex-1 items-center rounded-lg py-2.5 ${
							disabled ? "opacity-40" : "active:opacity-60"
						} ${selected ? "bg-background" : ""}`}
					>
						<Text className={tone}>{label}</Text>
					</Pressable>
				);
			})}
		</View>
	);
}
