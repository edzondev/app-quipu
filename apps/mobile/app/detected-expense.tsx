import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { withUniwind } from "uniwind";
import { ExpenseSheetForm } from "@/shared/components/expenses/expense-sheet-form";
import { useExpenseActions } from "@/shared/hooks/use-expense-actions";
import { useHardwareBack } from "@/shared/hooks/use-hardware-back";
import { type ExpenseDraftInput, ExpenseValidationError } from "@/shared/lib/expenses/draft";
import { readActionError } from "@/shared/lib/expenses/errors";
import { routeParam } from "@/shared/lib/expenses/expense-record";

const SafeArea = withUniwind(SafeAreaView);
const LIMA_TIME = new Intl.DateTimeFormat("es-PE", {
	hour: "2-digit",
	minute: "2-digit",
	hourCycle: "h23",
	timeZone: "America/Lima",
});

function centsOf(value: unknown): number {
	const raw = routeParam(value);
	if (!/^\d+$/.test(raw)) return 0;
	const cents = Number(raw);
	return Number.isSafeInteger(cents) && cents > 0 ? cents : 0;
}

export default function DetectedExpenseScreen() {
	const router = useRouter();
	const params = useLocalSearchParams();
	const id = routeParam(params.id);
	const postedAt = Number(routeParam(params.at));
	const when =
		Number.isSafeInteger(postedAt) && postedAt > 0 ? LIMA_TIME.format(new Date(postedAt)) : "";
	const meta = [routeParam(params.bank), when].filter((part) => part.length > 0).join(" · ");
	const { register } = useExpenseActions();
	const [formError, setFormError] = useState<string | null>(null);
	const [isSubmitting, setSubmitting] = useState(false);

	function close() {
		if (router.canGoBack()) router.back();
		else router.replace("/(tabs)");
	}

	function save(input: ExpenseDraftInput) {
		setFormError(null);
		setSubmitting(true);
		void register(input, id).then(
			() => close(),
			(error: unknown) => {
				setSubmitting(false);
				setFormError(
					error instanceof ExpenseValidationError
						? error.message
						: readActionError(error, "No se pudo guardar el gasto."),
				);
			},
		);
	}

	useHardwareBack(close);
	if (id.length === 0) {
		return (
			<SafeArea className="flex-1 bg-background px-[22px] pt-6" edges={["top", "bottom"]}>
				<Text className="font-hanken text-[15px] text-foreground/55">
					No encontramos este gasto.
				</Text>
			</SafeArea>
		);
	}

	return (
		<SafeArea className="flex-1 bg-background" edges={["top", "bottom"]}>
			{meta.length > 0 ? (
				<Text className="px-[22px] pt-6 font-geist-mono text-[12px] text-foreground/55">
					{meta}
				</Text>
			) : null}
			<ExpenseSheetForm
				currencySymbol="S/"
				dailyCents={null}
				initial={{
					amountCents: centsOf(params.cents),
					description: routeParam(params.merchant),
					envelopeType: null,
				}}
				formError={formError}
				isSubmitting={isSubmitting}
				onSubmit={save}
				onCancel={close}
			/>
		</SafeArea>
	);
}
