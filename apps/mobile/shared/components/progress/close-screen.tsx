import { Pressable, ScrollView, Text, View } from "react-native";
import { ChevronLeft } from "reicon-react-native/icons/ChevronLeft";
import { HIT_SLOP } from "@/shared/lib/hit-slop";
import type { CloseScreenModel, CloseSegmentTone } from "@/shared/lib/progress/model";

const SEGMENT: Record<CloseSegmentTone, string> = {
	needs: "bg-needs",
	wants: "bg-wants",
	savings: "bg-savings",
	surplus: "bg-line",
};

type Props = {
	status: "loading" | "ready";
	model: CloseScreenModel | null;
	onBack: () => void;
};

export function CloseScreen({ status, model, onBack }: Props) {
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

			{status === "loading" ? (
				<Text className="mt-6 font-hanken text-[15px] text-foreground/55">Cargando…</Text>
			) : model ? (
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
									accessibilityLabel={segment.label}
									className={`h-full ${SEGMENT[segment.tone]}`}
									// El tramo es un % de datos: Uniwind no tiene clase para ese ancho.
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
						{model.rows.map((row, index) => (
							<View
								key={row.label}
								className={`flex-row items-center justify-between py-3.5 ${
									index === model.rows.length - 1 ? "" : "border-b border-[#F0EEE8]"
								}`}
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
				<View className="flex-1 items-center justify-center">
					<Text className="text-center font-newsreader text-[23px] leading-8 text-foreground">
						Aún no hay un cierre.
					</Text>
					<Text className="mt-3 max-w-[300px] text-center font-hanken text-[14.5px] leading-6 text-[#6B6B6B]">
						El resumen aparece al cerrar un ciclo.
					</Text>
					<Pressable
						accessibilityRole="button"
						accessibilityLabel="Volver a Progreso"
						onPress={onBack}
						className="mt-[22px] rounded-xl border border-[#DAD7CE] px-[22px] py-3.5 active:opacity-60"
					>
						<Text className="font-hanken-semibold text-[14px] text-foreground">
							Volver a Progreso
						</Text>
					</Pressable>
				</View>
			)}
		</View>
	);
}
