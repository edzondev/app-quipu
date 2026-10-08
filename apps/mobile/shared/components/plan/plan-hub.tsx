import { Pressable, ScrollView, Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { ChevronRight } from "@/shared/components/ui/reicon";
import { HIT_SLOP } from "@/shared/lib/hit-slop";
import type { PlanHubModel, PlanSegment } from "@/shared/lib/plan/model";
import type { AhorroPlanRow } from "@/shared/lib/savings/model";

/** El hub entra con un fade corto, el mismo criterio que el buscador de Movimientos. */
const ENTERING = FadeIn.duration(180);

const DOT = {
	needs: "bg-needs",
	wants: "bg-wants",
	savings: "bg-savings",
	commitments: "bg-warning",
	reparto: "bg-foreground/35",
} as const;

const TONE = {
	plain: "text-foreground/55",
	warning: "text-warning",
	muted: "text-foreground/45",
} as const;

const SUBTITLE = "Dónde está tu dinero antes de que lo gastes.";

type Props = {
	status: "loading" | "empty" | "ready";
	model: PlanHubModel | null;
	ahorro: AhorroPlanRow | null;
	onOpenSobres: () => void;
	onOpenCommitments: () => void;
	onOpenAhorro: () => void;
};

export function PlanHub({
	status,
	model,
	ahorro,
	onOpenSobres,
	onOpenCommitments,
	onOpenAhorro,
}: Props) {
	return (
		<ScrollView
			className="flex-1"
			contentContainerClassName="grow pb-8"
			showsVerticalScrollIndicator={false}
		>
			<View className="flex-row items-baseline justify-between">
				<Text className="font-newsreader text-[27px] leading-8 text-foreground">Plan</Text>
				{model?.cycleLabel ? (
					<Text className="font-geist-mono text-[11px] tracking-[0.12em] text-foreground/45">
						{model.cycleLabel}
					</Text>
				) : null}
			</View>
			<Text className="mt-2 font-hanken text-[14px] leading-[21px] text-foreground/55">
				{SUBTITLE}
			</Text>
			{status === "loading" ? (
				<Text className="mt-6 font-hanken text-[15px] text-foreground/55">Cargando…</Text>
			) : null}
			{model ? (
				<Animated.View entering={ENTERING}>
					{model.totalLabel && model.segments ? (
						<TotalBlock label={model.totalLabel} segments={model.segments} />
					) : null}
					<View className="mt-3.5">
						<HubRow
							dotClass={DOT.needs}
							title="Sobres"
							subtitle="Necesidades, Gustos y Ahorro"
							value={model.envelopeCount}
							onPress={onOpenSobres}
						/>
						<HubRow
							dotClass={DOT.commitments}
							title="Compromisos"
							subtitle={model.commitmentsSubtitle}
							subtitleClass={TONE[model.commitmentsTone]}
							value={model.commitmentsTotal}
							onPress={onOpenCommitments}
						/>
						<HubRow
							dotClass={DOT.savings}
							title="Ahorro y metas"
							subtitle={ahorro?.subtitle ?? null}
							value={ahorro?.totalLabel ?? null}
							onPress={onOpenAhorro}
							isLast={model.repartoSubtitle == null}
						/>
						{model.repartoSubtitle ? (
							<HubRow
								dotClass={DOT.reparto}
								title="Reparto del ciclo"
								subtitle={model.repartoSubtitle}
								isLast
							/>
						) : null}
					</View>
				</Animated.View>
			) : null}
		</ScrollView>
	);
}

function TotalBlock({ label, segments }: { label: string; segments: PlanSegment[] }) {
	return (
		<View className="mt-6 border-y border-line py-[18px]">
			<View className="flex-row items-baseline justify-between">
				<Text className="font-geist-mono text-[10.5px] tracking-[0.14em] text-foreground/55">
					TOTAL REPARTIDO
				</Text>
				<Text className="font-newsreader text-[22px] text-foreground tabular-nums" selectable>
					{label}
				</Text>
			</View>
			<View
				accessibilityLabel="Total repartido"
				className="mt-3.5 h-2 flex-row gap-[2px] overflow-hidden rounded"
			>
				{segments.map((segment) =>
					segment.percent > 0 ? (
						<View
							key={segment.tone}
							accessibilityLabel={`Tramo ${segment.tone}`}
							className={`h-full ${DOT[segment.tone]}`}
							// El ancho es el % de lo que queda en el sobre: Uniwind no tiene clase para ese valor.
							style={{ width: `${segment.percent}%` }}
						/>
					) : null,
				)}
			</View>
		</View>
	);
}

function HubRow({
	dotClass,
	title,
	subtitle,
	subtitleClass = "text-foreground/55",
	value,
	onPress,
	isLast = false,
}: {
	dotClass: string;
	title: string;
	subtitle: string | null;
	subtitleClass?: string;
	value?: string | null;
	onPress?: () => void;
	isLast?: boolean;
}) {
	const row = (
		<View
			className={`flex-row items-center justify-between py-[17px] ${
				isLast ? "" : "border-b border-foreground/10"
			}`}
		>
			<View className="min-w-0 flex-1 flex-row items-center gap-[13px] pr-3">
				<View className={`h-2 w-2 rounded-full ${dotClass}`} />
				<View className="min-w-0 flex-1">
					<Text className="font-hanken-semibold text-[15.5px] text-foreground">{title}</Text>
					{subtitle ? (
						<Text className={`mt-1.5 font-hanken text-[12.5px] ${subtitleClass}`} numberOfLines={2}>
							{subtitle}
						</Text>
					) : null}
				</View>
			</View>
			<View className="flex-row items-center gap-2.5">
				{value ? (
					<Text className="font-hanken text-[14px] text-foreground/45 tabular-nums">{value}</Text>
				) : null}
				{onPress ? <ChevronRight size={16} colorClassName="text-foreground/45" /> : null}
			</View>
		</View>
	);
	if (!onPress) return row;
	return (
		<Pressable
			accessibilityRole="button"
			accessibilityLabel={title}
			hitSlop={HIT_SLOP}
			onPress={onPress}
			className="active:opacity-60"
		>
			{row}
		</Pressable>
	);
}
