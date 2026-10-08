import { api } from "@quipu/convex-api";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { ErrorText } from "@/shared/components/forms/field-error";
import { useProfileGate } from "@/shared/hooks/use-profile-gate";
import { readActionError } from "@/shared/lib/expenses/errors";
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
	const moveToFund = useMutation(api.savings.moveClosedCycleSurplusToFund);
	const [pending, setPending] = useState(false);
	const [error, setError] = useState<string | null>(null);

	if (surplus == null || surplus.total === 0 || surplus.movedAt !== null) return null;
	const closedCycleId = surplus.closedCycleId;

	async function onMove() {
		if (pending) return;
		setPending(true);
		setError(null);
		try {
			await moveToFund({ closedCycleId });
		} catch (caught) {
			setError(readActionError(caught, "No se pudo mover el sobrante al Fondo."));
		} finally {
			setPending(false);
		}
	}

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
			<Pressable
				accessibilityRole="button"
				accessibilityLabel="Mover al Fondo"
				accessibilityState={{ disabled: pending }}
				disabled={pending}
				onPress={() => void onMove()}
				className={`mt-[22px] items-center rounded-[13px] bg-primary py-4 active:opacity-80 ${
					pending ? "opacity-60" : ""
				}`}
			>
				<Text className="font-hanken-semibold text-[15px] text-background">
					{pending ? "Moviendo…" : "Mover al Fondo"}
				</Text>
			</Pressable>
			{error ? <ErrorText message={error} /> : null}
		</View>
	);
}
