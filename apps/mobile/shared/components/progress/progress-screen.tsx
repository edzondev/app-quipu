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

const CURRENT_STRIPES = Array.from({ length: 8 }, (_, index) =>
	index % 2 === 0 ? "bg-line" : "bg-background",
);

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
			<Text className="mt-[26px] font-geist-mono text-[10.5px] tracking-[0.14em] text-[#6B6B6B]">
				CICLOS CERRADOS EN VERDE
			</Text>
			<View className="mt-3 flex-row items-baseline gap-2.5">
				<Text className="font-newsreader text-[58px] leading-none tracking-tight text-foreground tabular-nums">
					{model.streakLabel}
				</Text>
				<Text className="font-hanken text-[17px] text-[#6B6B6B]">seguidos</Text>
			</View>

			{model.bars.length > 0 ? (
				<View className="mt-5 flex-row gap-[7px]">
					{model.bars.map((bar) => (
						<CycleBar key={bar.key} bar={bar} />
					))}
				</View>
			) : null}

			{model.savedLabel || model.registeredExpenseLabel || model.daysWithoutSkippingLabel ? (
				<View className="mt-7 flex-row justify-between border-y border-[#E8E6DF] py-[18px]">
					{model.savedLabel ? <Stat label="AHORRADO TOTAL" value={model.savedLabel} /> : null}
					{model.registeredExpenseLabel ? (
						<Stat label="GASTOS REGISTRADOS" value={model.registeredExpenseLabel} />
					) : null}
					{model.daysWithoutSkippingLabel ? (
						<Stat label="DÍAS SIN SALTAR" value={model.daysWithoutSkippingLabel} />
					) : null}
				</View>
			) : null}

			{model.achievements.length > 0 ? (
				<View className="mt-[22px]">
					<Text className="mb-1.5 font-geist-mono text-[10.5px] tracking-[0.14em] text-[#6B6B6B]">
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
				<View className="mt-4 rounded-[14px] bg-[#F3F1EB] px-[18px] py-[15px]">
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
			? "mt-[7px] text-center font-geist-mono text-[10px] text-foreground/35"
			: "mt-[7px] text-center font-geist-mono text-[10px] text-foreground/50";
	return (
		<View className="flex-1">
			{bar.tone === "current" ? (
				<View
					accessibilityLabel="Ciclo en curso"
					className="h-[34px] flex-row overflow-hidden rounded-[5px]"
				>
					{CURRENT_STRIPES.map((tone, index) => (
						<View key={`${tone}-${String(index)}`} className={`h-full flex-1 ${tone}`} />
					))}
				</View>
			) : (
				<View className={`h-[34px] rounded-[5px] ${SOLID_BAR[bar.tone]}`} />
			)}
			{bar.monthLabel ? <Text className={monthClass}>{bar.monthLabel}</Text> : null}
		</View>
	);
}

function Stat({ label, value }: { label: string; value: string }) {
	return (
		<View>
			<Text className="font-geist-mono text-[12px] text-[#8C8880]">{label}</Text>
			<Text className="mt-[9px] font-newsreader text-[24px] text-foreground tabular-nums">
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
				className={`h-[30px] w-[30px] items-center justify-center rounded-[9px] ${
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
