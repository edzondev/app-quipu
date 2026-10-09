import { api } from "@quipu/convex-api";
import { useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { Text, View } from "react-native";
import { useProfileGate } from "@/shared/hooks/use-profile-gate";
import { formatCentsTrimmed } from "@/shared/lib/money";

export type ClosedCycleSurplus = FunctionReturnType<typeof api.savings.getClosedCycleSurplus>;

const ROWS = [
	{ key: "needs", label: "Necesidades" },
	{ key: "wants", label: "Gustos" },
	{ key: "extraordinary", label: "Ingresos extra" },
] as const;

export function ClosedCycleSurplusCard() {
	const { isAuthReady } = useProfileGate();
	const surplus = useQuery(api.savings.getClosedCycleSurplus, isAuthReady ? {} : "skip");

	if (surplus == null || surplus.total === 0) return null;

	return (
		<View className="mt-[22px]">
			<Text className="font-geist-mono text-[10.5px] tracking-[0.14em] text-foreground/55">
				SOBRANTE
			</Text>
			<Text className="mt-2 font-newsreader text-[28px] text-foreground tabular-nums">
				{formatCentsTrimmed(surplus.total)}
			</Text>
			<View className="mt-3 border-t border-line">
				{ROWS.map((row, index) => (
					<View
						key={row.key}
						className={`flex-row items-center justify-between py-3.5 ${
							index === ROWS.length - 1 ? "" : "border-b border-line"
						}`}
					>
						<Text className="font-hanken text-[14.5px] text-foreground/55">{row.label}</Text>
						<Text className="font-hanken-semibold text-[14.5px] text-foreground tabular-nums">
							{formatCentsTrimmed(surplus[row.key])}
						</Text>
					</View>
				))}
			</View>
		</View>
	);
}
