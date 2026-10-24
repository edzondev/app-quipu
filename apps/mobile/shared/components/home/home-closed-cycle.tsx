import { api } from "@quipu/convex-api";
import type { FunctionReturnType } from "convex/server";
import { Pressable, Text, View } from "react-native";
import { inclusiveEndDate, limaDayLabel } from "@/shared/lib/lima-date";
import { formatCentsTrimmed, overspentByLabel } from "@/shared/lib/money";
import { HomeIdentity } from "./home-identity";

type Summary = NonNullable<FunctionReturnType<typeof api.dashboard.getSummary>>;
type ClosedCycleSummary = NonNullable<Summary["closedCycle"]>;

function closedCycleMessage(cycle: ClosedCycleSummary, symbol: string): string {
	const start = limaDayLabel(cycle.startDate);
	const end = limaDayLabel(inclusiveEndDate(cycle.endDate));
	const header = `CICLO ${start}–${end} · CERRADO`;
	if (cycle.surplusCents > 0) {
		const left = formatCentsTrimmed(cycle.surplusCents, symbol);
		return `${header}\nTe quedaron ${left}\nPasan a tu próximo ciclo.`;
	}
	if (cycle.surplusCents < 0) {
		return `${header}\n${overspentByLabel(cycle.surplusCents, symbol)}\nSe descuenta de tu próximo ingreso.`;
	}
	return header;
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
			<HomeIdentity initial={initial} name={name} onOpenSettings={onOpenSettings} />
			<View className="mt-6 rounded-2xl border border-line px-5 py-5">
				<Text className="font-hanken text-[15px] leading-6 text-foreground">
					{closedCycleMessage(closedCycle, currencySymbol)}
				</Text>
				<Pressable
					accessibilityRole="button"
					accessibilityLabel="Registrar ingreso"
					onPress={onRegisterIncome}
					className="mt-3 items-center rounded-[13px] border border-line py-4 active:opacity-80"
				>
					<Text className="font-hanken-semibold text-[15px] text-foreground">
						Registrar ingreso
					</Text>
				</Pressable>
			</View>
		</View>
	);
}
