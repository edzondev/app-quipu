import { api } from "@quipu/convex-api";
import type { FunctionReturnType } from "convex/server";
import { Pressable, Text, View } from "react-native";
import { inclusiveEndDate, limaDayLabel } from "@/shared/lib/lima-date";
import { formatCentsTrimmed } from "@/shared/lib/money";
import { HomeIdentity } from "./home-identity";

type Summary = NonNullable<FunctionReturnType<typeof api.dashboard.getSummary>>;
type ClosedCycleSummary = NonNullable<Summary["closedCycle"]>;

function closedCycleMessage(cycle: ClosedCycleSummary, symbol: string): string {
	const start = limaDayLabel(cycle.startDate);
	const end = limaDayLabel(inclusiveEndDate(cycle.endDate));
	const ended = `Tu ciclo del ${start} al ${end} terminó.`;
	const kept = "Tus movimientos siguen guardados.";
	if (cycle.surplusCents > 0) {
		const left = formatCentsTrimmed(cycle.surplusCents, symbol);
		return `${ended} Te quedaron ${left} y se suman a tu próximo ingreso. ${kept}`;
	}
	if (cycle.surplusCents < 0) {
		const over = formatCentsTrimmed(Math.abs(cycle.surplusCents), symbol);
		return `${ended} Te pasaste por ${over} y se descuenta de tu próximo ingreso. ${kept}`;
	}
	return `${ended} ${kept}`;
}

export function HomeClosedCycle({
	name,
	initial,
	closedCycle,
	currencySymbol,
	onOpenSettings,
	onRegisterIncome,
}: {
	name: string;
	initial: string;
	closedCycle: ClosedCycleSummary;
	currencySymbol: string;
	onOpenSettings: () => void;
	onRegisterIncome: () => void;
}) {
	return (
		<View className="flex-1">
			<HomeIdentity
				initial={initial}
				title={name}
				onOpenSettings={onOpenSettings}
				onRegisterIncome={onRegisterIncome}
			/>
			<View className="mt-6 rounded-2xl border border-line px-5 py-5">
				<Text className="font-hanken text-[15px] leading-6 text-foreground">
					{closedCycleMessage(closedCycle, currencySymbol)}
				</Text>
				<Pressable
					accessibilityRole="button"
					accessibilityLabel="Registrar nuevo ingreso"
					onPress={onRegisterIncome}
					className="mt-3 items-center rounded-[13px] border border-line py-4 active:opacity-80"
				>
					<Text className="font-hanken-semibold text-[15px] text-foreground">
						Registrar nuevo ingreso
					</Text>
				</Pressable>
			</View>
		</View>
	);
}
