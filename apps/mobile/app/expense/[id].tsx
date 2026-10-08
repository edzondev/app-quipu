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
import { useProfileGate } from "@/shared/hooks/use-profile-gate";
import type { ExpenseDraftInput } from "@/shared/lib/expenses/draft";
import { ExpenseValidationError } from "@/shared/lib/expenses/draft";
import { readActionError } from "@/shared/lib/expenses/errors";
import {
	lookupExpense,
	mapFrequentExpenses,
	readCreateDraft,
	routeParam,
} from "@/shared/lib/expenses/expense-record";
import { formatKeypadAmount } from "@/shared/lib/expenses/keypad";
import { marketFromCurrencyCode } from "@/shared/lib/onboarding/markets";

const SafeArea = withUniwind(SafeAreaView);

export default function ExpenseDetailScreen() {
	const router = useRouter();
	const params = useLocalSearchParams();
	const id = routeParam(params.id);
	const mode = id === "new" ? "create" : "edit";
	const { isAuthReady, profile } = useProfileGate();
	const home = useHomeModel();
	const movements = useQuery(api.movements.listForActiveCycle, isAuthReady ? {} : "skip");
	const recent = useQuery(api.expenses.getRecentExpenses, isAuthReady ? {} : "skip");
	const { register, update, remove } = useExpenseActions();
	const [fieldError, setFieldError] = useState<{
		field: ExpenseValidationError["field"];
		message: string;
	} | null>(null);
	const [formError, setFormError] = useState<string | null>(null);
	const [isSubmitting, setSubmitting] = useState(false);
	const [openedAt] = useState(() => Date.now());

	const lookup = lookupExpense(movements, id);
	const editing = lookup.status === "ready" ? lookup.expense : null;
	const seed = readCreateDraft({
		amountRaw: routeParam(params.amountRaw),
		description: routeParam(params.description),
		envelopeType: routeParam(params.envelopeType),
	});
	const symbol = currencySymbol(home, profile?.currencyCode);
	const dailyCents = home.status === "ready" ? home.home.dailyCents : null;

	function goBack() {
		if (router.canGoBack()) router.back();
		else router.replace("/(tabs)");
	}

	async function submit(input: ExpenseDraftInput) {
		setFieldError(null);
		setFormError(null);
		setSubmitting(true);
		try {
			if (mode === "edit") await update(id, input);
			else await register(input);
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

	const showForm = mode === "create" || editing !== null;
	const initial = editing
		? {
				amountRaw: formatKeypadAmount(editing.amountCents),
				description: editing.description,
				envelopeType: editing.envelopeType,
			}
		: {
				amountRaw: seed.amountRaw.trim() ? seed.amountRaw : formatKeypadAmount(0),
				description: seed.description,
				envelopeType: seed.envelopeType,
			};

	return (
		<SafeArea className="flex-1 bg-background" edges={["top", "bottom"]}>
			<KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
				{mode === "edit" && !showForm ? (
					<View className="flex-1 px-[22px] pt-3">
						<Pressable accessibilityRole="button" onPress={goBack}>
							<Text className="font-hanken-semibold text-[15px] text-foreground">Volver</Text>
						</Pressable>
						<Text className="pt-6 font-hanken text-[15px] text-foreground/55">
							{lookup.status === "loading" ? "Cargando…" : "No encontramos este gasto."}
						</Text>
					</View>
				) : null}
				{showForm ? (
					<ExpenseDetailForm
						key={mode === "edit" ? id : createKey(seed)}
						mode={mode}
						currencySymbol={symbol}
						dailyCents={dailyCents}
						previousAmountCents={editing ? editing.amountCents : 0}
						initial={initial}
						timestamp={editing ? editing.timestamp : openedAt}
						frecuentes={mapFrequentExpenses(recent)}
						fieldError={fieldError}
						formError={formError}
						isSubmitting={isSubmitting}
						onSubmit={(input) => {
							void submit(input);
						}}
						onBack={goBack}
						onDelete={mode === "edit" ? askDelete : undefined}
					/>
				) : null}
			</KeyboardAvoidingView>
		</SafeArea>
	);
}

function createKey(seed: ExpenseDraftInput): string {
	return `${seed.amountRaw}|${seed.description}|${seed.envelopeType ?? ""}`;
}

function currencySymbol(home: ReturnType<typeof useHomeModel>, currencyCode: unknown): string {
	if (home.status === "ready") return home.home.currencySymbol;
	if (typeof currencyCode === "string") {
		return marketFromCurrencyCode(currencyCode)?.currencySymbol ?? "S/";
	}
	return "S/";
}
