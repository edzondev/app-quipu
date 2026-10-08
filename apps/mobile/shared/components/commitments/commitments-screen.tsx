import { Pressable, ScrollView, Text, View } from "react-native";
import { ChevronLeft } from "reicon-react-native/icons/ChevronLeft";
import type {
	CommitmentRowView,
	CommitmentStatusTone,
	CommitmentsScreenModel,
} from "@/shared/lib/commitments/model";
import { HIT_SLOP } from "@/shared/lib/hit-slop";

const SUBTITLE = "Quipu los reserva de Necesidades antes de calcular tu disponible.";

const STATUS_TEXT: Record<CommitmentStatusTone, string> = {
	calm: "text-primary",
	fast: "text-warning",
	muted: "text-foreground/45",
};

type Props = {
	status: "loading" | "ready";
	model: CommitmentsScreenModel | null;
	onBack: () => void;
	onAdd: () => void;
};

export function CommitmentsScreen({ status, model, onBack, onAdd }: Props) {
	const isEmpty = model != null && model.rows.length === 0;

	return (
		<View className="flex-1">
			<ScrollView
				className="flex-1"
				contentContainerClassName="grow"
				showsVerticalScrollIndicator={false}
			>
				<Pressable
					accessibilityRole="button"
					accessibilityLabel="Volver"
					hitSlop={HIT_SLOP}
					onPress={onBack}
					className="mb-3 self-start active:opacity-60"
				>
					<ChevronLeft size={22} color="#1A1A1A" />
				</Pressable>
				<Text className="font-newsreader text-[27px] leading-8 text-foreground">Compromisos</Text>
				<Text className="mt-2 max-w-[300px] font-hanken text-[14px] leading-[21px] text-foreground/55">
					{SUBTITLE}
				</Text>

				{status === "loading" ? (
					<Text className="mt-6 font-hanken text-[15px] text-foreground/55">Cargando…</Text>
				) : null}

				{model ? <ReservedBlock model={model} empty={isEmpty} /> : null}

				{isEmpty ? (
					<View className="mt-10">
						<Text className="font-geist-mono text-[10.5px] tracking-[0.14em] text-foreground/35">
							SIN COMPROMISOS
						</Text>
						<Text className="mt-3.5 font-newsreader text-[23px] leading-8 text-foreground">
							Aún no registras tus pagos fijos.
						</Text>
						<Text className="mt-3 max-w-[300px] font-hanken text-[14.5px] leading-6 text-foreground/55">
							Alquiler, servicios y suscripciones. Los registras una vez y Quipu los tiene en cuenta
							cada ciclo.
						</Text>
						<Pressable
							accessibilityRole="button"
							accessibilityLabel="Agregar compromiso"
							onPress={onAdd}
							className="mt-[22px] self-start rounded-xl bg-foreground px-[22px] py-3.5 active:opacity-80"
						>
							<Text className="font-hanken-semibold text-[14px] text-background">
								Agregar compromiso
							</Text>
						</Pressable>
					</View>
				) : null}

				{model && model.rows.length > 0 ? (
					<View className="mt-[18px]">
						{model.rows.map((row, index) => (
							<CommitmentLine key={row.id} row={row} isLast={index === model.rows.length - 1} />
						))}
					</View>
				) : null}
			</ScrollView>

			{model && model.rows.length > 0 ? (
				<Pressable
					accessibilityRole="button"
					accessibilityLabel="Agregar compromiso"
					onPress={onAdd}
					className="mt-4 items-center rounded-xl border border-[#DAD7CE] py-[15px] active:opacity-60"
				>
					<Text className="font-hanken-semibold text-[14px] text-foreground">
						Agregar compromiso
					</Text>
				</Pressable>
			) : null}
		</View>
	);
}

function ReservedBlock({ model, empty }: { model: CommitmentsScreenModel; empty: boolean }) {
	return (
		<View className="mt-6 border-y border-line py-[18px]">
			<View className="flex-row items-baseline justify-between">
				<Text className="font-geist-mono text-[10.5px] tracking-[0.14em] text-foreground/55">
					RESERVADO ESTE CICLO
				</Text>
				<Text
					className={`font-newsreader text-[22px] tabular-nums ${
						empty ? "text-foreground/30" : "text-foreground"
					}`}
					selectable
				>
					{model.totalLabel}
				</Text>
			</View>
			<View className="mt-3.5 h-[5px] overflow-hidden rounded-[3px] bg-[#E4E1D9]">
				{/* El tramo pagado es un % de datos: Uniwind no tiene clase para ese ancho. */}
				<View className="h-full bg-primary" style={{ width: `${model.paidPercent}%` }} />
			</View>
			{empty ? null : (
				<View className="mt-[9px] flex-row items-center justify-between">
					<Text className="font-geist-mono text-[11.5px] text-primary">{model.paidLabel}</Text>
					<Text className="font-geist-mono text-[11.5px] text-foreground/45">
						{model.pendingLabel}
					</Text>
				</View>
			)}
		</View>
	);
}

function CommitmentLine({ row, isLast }: { row: CommitmentRowView; isLast: boolean }) {
	return (
		<View
			className={`flex-row items-center justify-between py-[15px] ${
				isLast ? "" : "border-b border-[#F0EEE8]"
			}`}
		>
			<View className="min-w-0 flex-1 pr-3">
				<Text className="font-hanken-semibold text-[15px] text-foreground" numberOfLines={1}>
					{row.name}
				</Text>
				<Text
					className={`mt-1.5 font-geist-mono text-[11.5px] ${
						row.metaTone === "soon" ? "text-warning" : "text-foreground/45"
					}`}
					numberOfLines={1}
				>
					{row.meta}
				</Text>
			</View>
			<View className="items-end">
				<Text
					className={`font-hanken-semibold text-[15px] tabular-nums ${
						row.amountMuted ? "text-foreground/45" : "text-foreground"
					}`}
					selectable
				>
					{row.amountLabel}
				</Text>
				<Text className={`mt-1.5 font-hanken text-[12px] ${STATUS_TEXT[row.statusTone]}`}>
					{row.statusLabel}
				</Text>
			</View>
		</View>
	);
}
