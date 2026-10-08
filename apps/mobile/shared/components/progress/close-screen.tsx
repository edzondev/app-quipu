import { Pressable, ScrollView, Text, View } from "react-native";
import { ChevronLeft } from "reicon-react-native/icons/ChevronLeft";
import { HIT_SLOP } from "@/shared/lib/hit-slop";
import type { CloseScreenModel, CloseSegmentTone } from "@/shared/lib/progress/model";

const SEGMENT: Record<CloseSegmentTone, string> = {
	needs: "bg-[#6E7C99]",
	wants: "bg-[#A6836A]",
	savings: "bg-[#5E8C79]",
	surplus: "bg-[#DEDBD2]",
};

type Props = {
	model: CloseScreenModel | null;
	onBack: () => void;
};

export function CloseScreen({ model, onBack }: Props) {
	return (
		<View className="flex-1">
			<View className="flex-row items-center">
				<Pressable
					accessibilityRole="button"
					accessibilityLabel="Volver"
					hitSlop={HIT_SLOP}
					onPress={onBack}
					className="active:opacity-60"
				>
					<ChevronLeft size={22} color="#1A1A1A" />
				</Pressable>
				<Text className="flex-1 text-center font-geist-mono text-[10.5px] tracking-[0.14em] text-[#6B6B6B]">
					{model?.eyebrow ?? "CICLO CERRADO"}
				</Text>
				<View className="w-[22px]" />
			</View>

			{model ? (
				<ScrollView
					className="flex-1"
					contentContainerClassName="grow pb-8"
					showsVerticalScrollIndicator={false}
				>
					<Text className="mt-[34px] font-newsreader text-[28px] leading-[36px] text-foreground">
						{model.title}
					</Text>
					<Text className="mt-3 font-hanken text-[14.5px] leading-6 text-[#6B6B6B]">
						{model.subtitle}
					</Text>

					{model.segments.length > 0 ? (
						<View className="mt-7 h-2.5 flex-row gap-0.5 overflow-hidden rounded-[5px]">
							{model.segments.map((segment) => (
								<View
									key={segment.tone}
									className={`h-full ${SEGMENT[segment.tone]}`}
									style={{ width: `${segment.percent}%` }}
								/>
							))}
						</View>
					) : null}

					<View className="mt-2.5 flex-row items-center justify-between">
						<Text className="font-geist-mono text-[10.5px] text-[#8C8880]">{model.spentLabel}</Text>
						{model.surplusLabel ? (
							<Text className="font-geist-mono text-[10.5px] text-[#8C8880]">
								{model.surplusLabel}
							</Text>
						) : null}
					</View>

					<View className="mt-[26px] border-t border-[#E8E6DF]">
						{model.rows.map((row) => (
							<View
								key={row.label}
								className="flex-row items-center justify-between border-b border-[#F0EEE8] py-3.5"
							>
								<Text className="font-hanken text-[14.5px] text-[#6B6B6B]">{row.label}</Text>
								<Text className="font-hanken-semibold text-[14.5px] text-foreground tabular-nums">
									{row.amountLabel}
								</Text>
							</View>
						))}
					</View>
				</ScrollView>
			) : (
				<Text className="mt-8 font-hanken text-[15px] text-[#6B6B6B]">
					No hay un cierre para mostrar.
				</Text>
			)}
		</View>
	);
}
