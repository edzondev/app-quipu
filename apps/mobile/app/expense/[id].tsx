import { api } from "@quipu/convex-api";
import { useQuery } from "convex/react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";
import { withUniwind } from "uniwind";
import { ExpenseDetailForm } from "@/shared/components/expenses/expense-detail-form";
import { useHomeModel } from "@/shared/hooks/use-dashboard";
import { useExpenseActions } from "@/shared/hooks/use-expense-actions";
import { useHardwareBack } from "@/shared/hooks/use-hardware-back";
import { useProfileGate } from "@/shared/hooks/use-profile-gate";
import type { ExpenseDraftInput } from "@/shared/lib/expenses/draft";
import { ExpenseValidationError } from "@/shared/lib/expenses/draft";
import { readActionError } from "@/shared/lib/expenses/errors";
import {
	lookupExpense,
	mapFrequentExpenses,
	routeParam,
} from "@/shared/lib/expenses/expense-record";
import { formatKeypadAmount } from "@/shared/lib/expenses/keypad";
import { marketFromCurrencyCode } from "@/shared/lib/onboarding/markets";
import { updateSpendableWidget } from "@/widgets/SpendableToday";

const SafeArea = withUniwind(SafeAreaView);

export default function ExpenseDetailScreen() {
	const router = useRouter();
	const params = useLocalSearchParams();
	const id = routeParam(params.id);
	const { isAuthReady, profile } = useProfileGate();
	const home = useHomeModel();
	const movements = useQuery(api.movements.listForActiveCycle, isAuthReady ? {} : "skip");
	const recent = useQuery(api.expenses.getRecentExpenses, isAuthReady ? {} : "skip");
	const { update, remove } = useExpenseActions();
	const [fieldError, setFieldError] = useState<{
		field: ExpenseValidationError["field"];
		message: string;
	} | null>(null);
	const [formError, setFormError] = useState<string | null>(null);
	const [isSubmitting, setSubmitting] = useState(false);

	const lookup = lookupExpense(movements, id);
	const editing = lookup.status === "ready" ? lookup.expense : null;
	const symbol = currencySymbol(home, profile?.currencyCode);
	const dailyCents = home.status === "ready" ? home.home.dailyCents : null;

	function goBack() {
		if (router.canGoBack()) router.back();
		else router.replace("/(tabs)/movements");
	}

	useHardwareBack(goBack);

	async function submit(input: ExpenseDraftInput) {
		setFieldError(null);
		setFormError(null);
		setSubmitting(true);
		try {
			await update(id, input);
			updateSpendableWidget({
				amountCents: dailyCents,
				currencySymbol: symbol,
				updatedAt: new Date(),
			});
			goBack();
		} catch (error) {
			if (error instanceof ExpenseValidationError) {
				setFieldError({ field: error.field, message: error.message });
			} else {
				setFormError(readActionError(error, "No se pudo guardar el gasto."));
			}
		} finally {
			setSubmitting(false);
		}
	}

	function askDelete() {
		Alert.alert("Eliminar gasto", "El monto vuelve al sobre.", [
			{ text: "Cancelar", style: "cancel" },
			{
				text: "Eliminar",
				style: "destructive",
				onPress: () => {
					void remove(id)
						.then(() => goBack())
						.catch((error: unknown) => {
							setFormError(readActionError(error, "No se pudo eliminar el gasto."));
						});
				},
			},
		]);
	}

	return (
		<SafeArea
			testID="expense-detail-screen"
			className="flex-1 bg-background"
			edges={["top", "bottom"]}
		>
			<KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
				{editing ? null : (
					<View className="flex-1 px-[22px] pt-3">
						<Pressable accessibilityRole="button" onPress={goBack}>
							<Text className="font-hanken-semibold text-[15px] text-foreground">Volver</Text>
						</Pressable>
						<Text className="pt-6 font-hanken text-[15px] text-foreground/55">
							{lookup.status === "loading" ? "Cargando…" : "No encontramos este gasto."}
						</Text>
					</View>
				)}
				{editing ? (
					<ExpenseDetailForm
						key={id}
						mode="edit"
						currencySymbol={symbol}
						dailyCents={dailyCents}
						previousAmountCents={editing.amountCents}
						initial={{
							amountRaw: formatKeypadAmount(editing.amountCents),
							description: editing.description,
							envelopeType: editing.envelopeType,
						}}
						timestamp={editing.timestamp}
						frecuentes={mapFrequentExpenses(recent)}
						fieldError={fieldError}
						formError={formError}
						isSubmitting={isSubmitting}
						onSubmit={(input) => {
							void submit(input);
						}}
						onBack={goBack}
						onDelete={askDelete}
					/>
				) : null}
			</KeyboardAvoidingView>
		</SafeArea>
	);
}

function currencySymbol(home: ReturnType<typeof useHomeModel>, currencyCode: unknown): string {
	if (home.status === "ready") return home.home.currencySymbol;
	if (typeof currencyCode === "string") {
		return marketFromCurrencyCode(currencyCode)?.currencySymbol ?? "S/";
	}
	return "S/";
}
