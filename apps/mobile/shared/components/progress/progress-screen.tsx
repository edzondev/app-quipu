import { Pressable, ScrollView, Text, View } from "react-native";
import { Check } from "reicon-react-native/icons/Check";
import { ChevronRight } from "reicon-react-native/icons/ChevronRight";
import type {
	AchievementRowView,
	ProgressBarView,
	ProgressScreenModel,
} from "@/shared/lib/progress/model";

const SOLID_BAR: Record<Exclude<ProgressBarView["tone"], "current">, string> = {
	compliant: "bg-savings",
	warning: "bg-warning",
	failed: "bg-foreground/30",
};

type Props = {
	status: "loading" | "ready";
	model: ProgressScreenModel | null;
	onOpenClose: () => void;
	onOpenPlan: () => void;
};

export function ProgressScreen({ status, model, onOpenClose, onOpenPlan }: Props) {
	return (
		<View className="flex-1">
			<ScrollView
				className="flex-1"
				contentContainerClassName="grow pb-8"
				showsVerticalScrollIndicator={false}
			>
				<View className="flex-row items-baseline justify-between">
					<Text className="font-newsreader text-[27px] leading-8 text-foreground">Progreso</Text>
					{model?.sinceLabel ? (
						<Text className="font-geist-mono text-[11px] tracking-[0.12em] text-foreground/50">
							{model.sinceLabel}
						</Text>
					) : null}
				</View>

				{status === "loading" ? (
					<Text className="mt-6 font-hanken text-[15px] text-foreground/55">Cargando…</Text>
				) : null}

				{model?.closeEntry ? (
					<Pressable
						accessibilityRole="button"
						accessibilityLabel={model.closeEntry.label}
						onPress={onOpenClose}
						className={`mt-6 flex-row items-center justify-between rounded-2xl px-4 py-4 active:opacity-70 ${
							model.closeEntry.highlighted
								? "border border-savings bg-savings/10"
								: "border border-line"
						}`}
					>
						<Text className="font-geist-mono text-[10.5px] tracking-[0.14em] text-[#6B6B6B]">
							{model.closeEntry.label}
						</Text>
						<ChevronRight size={16} color="#9A968C" />
					</Pressable>
				) : null}

				{model?.empty ? <EmptyProgress onOpenPlan={onOpenPlan} /> : null}

				{model && !model.empty ? <FilledProgress model={model} /> : null}
			</ScrollView>
		</View>
	);
}

function EmptyProgress({ onOpenPlan }: { onOpenPlan: () => void }) {
	return (
		<View className="flex-1 items-center justify-center">
			<Text className="text-center font-newsreader text-[23px] leading-8 text-foreground">
				Aún no cierras un ciclo.
			</Text>
			<Text className="mt-3 max-w-[300px] text-center font-hanken text-[14.5px] leading-6 text-[#6B6B6B]">
				La constancia aparece cuando el primero queda cerrado. Sin medallas ni apuro.
			</Text>
			<Pressable
				accessibilityRole="button"
				accessibilityLabel="Ir a Plan"
				onPress={onOpenPlan}
				className="mt-[22px] rounded-xl border border-[#DAD7CE] px-[22px] py-3.5 active:opacity-60"
			>
				<Text className="font-hanken-semibold text-[14px] text-foreground">Ir a Plan</Text>
			</Pressable>
		</View>
	);
}

function FilledProgress({ model }: { model: ProgressScreenModel }) {
	return (
		<View>
			<Text className="mt-8 font-geist-mono text-[10.5px] tracking-[0.14em] text-[#6B6B6B]">
				CICLOS CERRADOS EN VERDE
			</Text>
			<View className="mt-2.5 flex-row items-baseline gap-2.5">
				<Text className="font-newsreader text-[58px] leading-none tracking-tight text-foreground tabular-nums">
					{model.streakLabel}
				</Text>
				<Text className="font-newsreader text-[18px] text-[#6B6B6B]">seguidos</Text>
			</View>

			{model.bars.length > 0 ? (
				<View className="mt-6 flex-row gap-2">
					{model.bars.map((bar) => (
						<CycleBar key={bar.key} bar={bar} />
					))}
				</View>
			) : null}

			{model.savedLabel || model.registeredExpenseLabel || model.daysWithoutSkippingLabel ? (
				<View className="mt-8 flex-row gap-3 border-y border-line py-5">
					{model.savedLabel ? <Stat label={"AHORRADO\nTOTAL"} value={model.savedLabel} /> : null}
					{model.registeredExpenseLabel ? (
						<Stat label={"GASTOS\nREGISTRADOS"} value={model.registeredExpenseLabel} />
					) : null}
					{model.daysWithoutSkippingLabel ? (
						<Stat label={"DÍAS SIN\nSALTAR"} value={model.daysWithoutSkippingLabel} />
					) : null}
				</View>
			) : null}

			{model.achievements.length > 0 ? (
				<View className="mt-7">
					<Text className="mb-2 font-geist-mono text-[10.5px] tracking-[0.14em] text-[#6B6B6B]">
						LOGROS
					</Text>
					{model.achievements.map((row, index) => (
						<AchievementRow
							key={row.key}
							row={row}
							isLast={index === model.achievements.length - 1}
						/>
					))}
				</View>
			) : null}

			{model.rewardText ? (
				<View className="mt-5 rounded-[14px] bg-[#F3F1EB] px-[18px] py-4">
					<Text className="font-geist-mono text-[10.5px] tracking-[0.14em] text-primary">
						RECOMPENSA
					</Text>
					<Text className="mt-2 font-hanken text-[14.5px] leading-5 text-foreground">
						{model.rewardText}
					</Text>
				</View>
			) : null}
		</View>
	);
}

function CycleBar({ bar }: { bar: ProgressBarView }) {
	const monthClass =
		bar.tone === "current"
			? "mt-2 text-center font-geist-mono text-[10px] tracking-[0.06em] text-foreground/35"
			: "mt-2 text-center font-geist-mono text-[10px] tracking-[0.06em] text-foreground/50";
	return (
		<View className="min-w-0 flex-1">
			{bar.tone === "current" ? (
				<CurrentCycleBar />
			) : (
				<View className={`h-[34px] rounded-[5px] ${SOLID_BAR[bar.tone]}`} />
			)}
			{bar.monthLabel ? <Text className={monthClass}>{bar.monthLabel}</Text> : null}
		</View>
	);
}

/** Bloque claro con rayas diagonales (mismo patrón del mock). */
function CurrentCycleBar() {
	return (
		<View
			accessibilityLabel="Ciclo en curso"
			className="h-[34px] overflow-hidden rounded-[5px] bg-[#F7F5EF]"
		>
			{Array.from({ length: 20 }, (_, index) => (
				<View
					key={String(index)}
					style={{
						position: "absolute",
						top: -22,
						left: index * 14 - 28,
						width: 5,
						height: 78,
						backgroundColor: "#EDEAE1",
						transform: [{ rotate: "45deg" }],
					}}
				/>
			))}
		</View>
	);
}

function Stat({ label, value }: { label: string; value: string }) {
	return (
		<View className="min-w-0 flex-1">
			<Text
				className="h-[26px] font-geist-mono text-[10px] leading-[13px] tracking-[0.08em] text-foreground/50"
				numberOfLines={2}
			>
				{label}
			</Text>
			<Text className="mt-2 font-newsreader text-[22px] leading-7 text-foreground tabular-nums">
				{value}
			</Text>
		</View>
	);
}

function AchievementRow({ row, isLast }: { row: AchievementRowView; isLast: boolean }) {
	return (
		<View
			className={`flex-row items-center gap-3 py-3.5 ${isLast ? "" : "border-b border-[#F0EEE8]"}`}
		>
			<View
				className={`h-[30px] w-[30px] items-center justify-center rounded-full ${
					row.done ? "bg-savings/15" : "border border-dashed border-[#DAD7CE]"
				}`}
			>
				{row.done ? <Check size={15} color="#3C7D6E" /> : null}
			</View>
			<View className="min-w-0 flex-1">
				<Text
					className={`font-hanken text-[14.5px] ${row.done ? "text-foreground" : "text-[#8C8880]"}`}
					numberOfLines={2}
				>
					{row.title}
				</Text>
				{row.detail ? (
					<Text
						className={`mt-[5px] font-geist-mono text-[11.5px] ${
							row.done ? "text-[#8C8880]" : "text-[#B6B2A8]"
						}`}
					>
						{row.detail}
					</Text>
				) : null}
			</View>
		</View>
	);
}
