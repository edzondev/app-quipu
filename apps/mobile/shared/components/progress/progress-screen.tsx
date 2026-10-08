import { Pressable, ScrollView, Text, View } from "react-native";
import { Check } from "reicon-react-native/icons/Check";
import { ChevronRight } from "reicon-react-native/icons/ChevronRight";
import { HIT_SLOP } from "@/shared/lib/hit-slop";
import type {
	AchievementRowView,
	ProgressBarView,
	ProgressScreenModel,
} from "@/shared/lib/progress/model";

const BAR: Record<ProgressBarView["tone"], string> = {
	compliant: "bg-[#5E8C79]",
	warning: "bg-[#C99A3E]",
	failed: "bg-[#9A968C]",
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
						<Text className="font-geist-mono text-[11px] tracking-[0.12em] text-[#8C8880]">
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
						hitSlop={HIT_SLOP}
						onPress={onOpenClose}
						className={`mt-6 flex-row items-center justify-between rounded-2xl px-4 py-4 active:opacity-70 ${
							model.closeEntry.highlighted
								? "border border-[#5E8C79] bg-savings/10"
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
		<View className="flex-1 justify-center">
			<Text className="font-newsreader text-[23px] leading-8 text-foreground">
				Aún no cierras un ciclo.
			</Text>
			<Text className="mt-3 max-w-[300px] font-hanken text-[14.5px] leading-6 text-[#6B6B6B]">
				La constancia aparece cuando el primero queda cerrado. Sin medallas ni apuro.
			</Text>
			<Pressable
				accessibilityRole="button"
				accessibilityLabel="Ir a Plan"
				onPress={onOpenPlan}
				className="mt-[22px] self-start rounded-xl border border-[#DAD7CE] px-[22px] py-3.5 active:opacity-60"
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
						<View key={bar.key} className="flex-1">
							<View className={`h-[34px] rounded-[5px] ${BAR[bar.tone]}`} />
							<Text className="mt-[7px] text-center font-geist-mono text-[10px] text-[#8C8880]">
								{bar.monthLabel}
							</Text>
						</View>
					))}
				</View>
			) : null}

			{model.savedLabel ? (
				<View className="mt-7 border-y border-[#E8E6DF] py-[18px]">
					<Text className="font-geist-mono text-[12px] text-[#8C8880]">AHORRADO TOTAL</Text>
					<Text className="mt-[9px] font-newsreader text-[24px] text-foreground tabular-nums">
						{model.savedLabel}
					</Text>
				</View>
			) : null}

			{model.achievements.length > 0 ? (
				<View className="mt-[22px]">
					<Text className="mb-1.5 font-geist-mono text-[10.5px] tracking-[0.14em] text-[#6B6B6B]">
						LOGROS
					</Text>
					{model.achievements.map((row) => (
						<AchievementRow key={row.key} row={row} />
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

function AchievementRow({ row }: { row: AchievementRowView }) {
	return (
		<View className="flex-row items-center gap-3 border-b border-[#F0EEE8] py-3.5">
			<View
				className={`h-[30px] w-[30px] items-center justify-center rounded-[9px] ${
					row.done ? "bg-savings/15" : "border border-dashed border-[#DAD7CE]"
				}`}
			>
				{row.done ? <Check size={16} color="#3C7D6E" /> : null}
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
