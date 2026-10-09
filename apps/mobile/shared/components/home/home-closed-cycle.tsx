import { api } from "@quipu/convex-api";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { ErrorText } from "@/shared/components/forms/field-error";
import { useProfileGate } from "@/shared/hooks/use-profile-gate";
import { inclusiveEndDate, limaDayLabel } from "@/shared/lib/lima-date";
import { formatCentsTrimmed } from "@/shared/lib/money";
import { HomeIdentity } from "./home-identity";

type Summary = NonNullable<FunctionReturnType<typeof api.dashboard.getSummary>>;
type ClosedCycleSummary = NonNullable<Summary["closedCycle"]>;

const MOVE_ERROR = "No se pudo mover el sobrante al Fondo.";

function closedCycleMessage(cycle: ClosedCycleSummary, symbol: string): string {
	const start = limaDayLabel(cycle.startDate);
	const end = limaDayLabel(inclusiveEndDate(cycle.endDate));
	const ended = `Tu ciclo del ${start} al ${end} terminó.`;
	const kept = "Tus movimientos siguen guardados.";
	if (cycle.surplusCents === 0) return `${ended} ${kept}`;
	return `${ended} Te sobraron ${formatCentsTrimmed(cycle.surplusCents, symbol)}. ${kept}`;
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
	const canMove = closedCycle.surplusCents > 0 && closedCycle.surplusMovedAt === null;
	const alreadyMoved = closedCycle.surplusCents > 0 && closedCycle.surplusMovedAt !== null;

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
				{canMove ? <MoveSurplusButton /> : null}
				{alreadyMoved ? (
					<Text className="mt-4 text-center font-hanken text-[14px] text-foreground/55">
						Ya lo moviste
					</Text>
				) : null}
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

function MoveSurplusButton() {
	const { isAuthReady } = useProfileGate();
	const surplus = useQuery(api.savings.getClosedCycleSurplus, isAuthReady ? {} : "skip");
	const moveToFund = useMutation(api.savings.moveClosedCycleSurplusToFund);
	const pendingRef = useRef(false);
	const [pending, setPending] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function onMove() {
		if (pendingRef.current || surplus === undefined) return;
		const closedCycleId = surplus?.closedCycleId;
		if (!closedCycleId) {
			setError(MOVE_ERROR);
			return;
		}
		pendingRef.current = true;
		setPending(true);
		setError(null);
		try {
			await moveToFund({ closedCycleId });
		} catch {
			setError(MOVE_ERROR);
		} finally {
			pendingRef.current = false;
			setPending(false);
		}
	}

	return (
		<View>
			<Pressable
				accessibilityRole="button"
				accessibilityLabel="Mover al Fondo"
				accessibilityState={{ disabled: pending }}
				disabled={pending}
				onPress={() => {
					void onMove();
				}}
				className={`mt-4 items-center rounded-[13px] bg-primary py-4 active:opacity-80 ${
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
