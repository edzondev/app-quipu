import { Column, Spacer, Text } from "@expo/ui/jetpack-compose";
import { background, fillMaxSize, height, paddingAll } from "@expo/ui/jetpack-compose/modifiers";
import { createWidget, type WidgetEnvironment } from "expo-widgets";
import { Platform } from "react-native";
import { formatCents } from "@/shared/lib/money";

/** Amount Home already shows, plus when this snapshot was pushed. Null amount means no session or no value yet. */
export type SpendableWidgetData = {
	amountCents: number | null;
	currencySymbol: string;
	updatedAt: Date;
};

type SpendableWidgetProps = {
	headline: string;
	updated: string;
};

const PROMPT: SpendableWidgetProps = { headline: "Abre Quipu", updated: "" };

function SpendableTodayWidget(props: SpendableWidgetProps, environment: WidgetEnvironment) {
	"widget";
	// The widget bundle keeps only this function, so it cannot read global.css.
	// Hex values are the light/dark tokens already used by the app.
	const dark = environment.colorScheme === "dark";
	const surface = dark ? "#111417" : "#FBFAF7";
	const ink = dark ? "#F2F4F5" : "#1A1A1A";
	const muted = dark ? "#8D8F91" : "#7F7F7D";
	return (
		<Column
			horizontalAlignment="start"
			verticalArrangement="top"
			modifiers={[fillMaxSize(), background(surface), paddingAll(16)]}
		>
			<Text color={ink} style={{ fontSize: 20, fontWeight: "bold" }}>
				{props.headline}
			</Text>
			{props.updated === "" ? null : <Spacer modifiers={[height(6)]} />}
			{props.updated === "" ? null : (
				<Text color={muted} style={{ fontSize: 13 }}>
					{props.updated}
				</Text>
			)}
		</Column>
	);
}

const spendableToday = createWidget("SpendableToday", SpendableTodayWidget, PROMPT);

export function updateSpendableWidget(data: SpendableWidgetData) {
	if (Platform.OS !== "android") return;
	if (data.amountCents == null || !Number.isFinite(data.amountCents)) {
		spendableToday.updateSnapshot(PROMPT);
		return;
	}
	const hours = data.updatedAt.getHours();
	const minutes = String(data.updatedAt.getMinutes()).padStart(2, "0");
	spendableToday.updateSnapshot({
		headline: `Puedes gastar hoy ${formatCents(data.amountCents, data.currencySymbol)}`,
		updated: `Actualizado ${hours}:${minutes}`,
	});
}

export default spendableToday;
