import { ScrollView, Text, View } from "react-native";
import { ListRow } from "@/shared/components/list-row";
import { SectionLabel } from "@/shared/components/section-label";
import { HIDDEN_UNTIL_READY } from "@/shared/hidden-until-ready";
import type { PlanHubModel, PlanSegment } from "@/shared/lib/plan/model";
import type { AhorroPlanRow } from "@/shared/lib/savings/model";

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
	const showCycleSplit = model?.repartoSubtitle != null && !HIDDEN_UNTIL_READY.cycleSplit;

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
				<>
					{model.totalLabel && model.segments ? (
						<TotalBlock label={model.totalLabel} segments={model.segments} />
					) : null}
					<View className="mt-3.5">
						<ListRow
							testID="plan-row-sobres"
							dotClass={DOT.needs}
							label="Sobres"
							subtitle="Necesidades, Gustos y Ahorro"
							value={model.envelopeCount}
							onPress={onOpenSobres}
						/>
						<ListRow
							dotClass={DOT.commitments}
							label="Compromisos"
							subtitle={model.commitmentsSubtitle}
							subtitleClass={TONE[model.commitmentsTone]}
							value={model.commitmentsTotal}
							onPress={onOpenCommitments}
						/>
						<ListRow
							dotClass={DOT.savings}
							label="Ahorro y metas"
							subtitle={ahorro?.subtitle ?? null}
							value={ahorro?.totalLabel ?? null}
							onPress={onOpenAhorro}
							isLast={!showCycleSplit}
						/>
						{showCycleSplit ? (
							<ListRow
								dotClass={DOT.reparto}
								label="Reparto del ciclo"
								subtitle={model.repartoSubtitle}
								isLast
							/>
						) : null}
					</View>
				</>
			) : null}
		</ScrollView>
	);
}

function TotalBlock({ label, segments }: { label: string; segments: PlanSegment[] }) {
	return (
		<View className="mt-6 border-y border-line py-[18px]">
			<View className="flex-row items-baseline justify-between">
				<SectionLabel>TOTAL REPARTIDO</SectionLabel>
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
