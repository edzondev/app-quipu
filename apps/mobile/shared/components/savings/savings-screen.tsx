import { Pressable, ScrollView, Text, View } from "react-native";
import { ChevronLeft } from "reicon-react-native/icons/ChevronLeft";
import { Lock } from "reicon-react-native/icons/Lock";
import { ErrorText } from "@/shared/components/forms/field-error";
import { HIT_SLOP } from "@/shared/lib/hit-slop";
import type { AhorroScreenModel, FundView, GoalView } from "@/shared/lib/savings/model";

const DASHES = Array.from({ length: 60 }, (_, index) => `dash-${index}`);

type Props = {
	status: "loading" | "ready";
	model: AhorroScreenModel | null;
	surplusDismissed: boolean;
	movingSurplus: boolean;
	moveError: string | null;
	onBack: () => void;
	onAddGoal: () => void;
	onMoveSurplus: () => void;
	onDismissSurplus: () => void;
};

export function SavingsScreen({
	status,
	model,
	surplusDismissed,
	movingSurplus,
	moveError,
	onBack,
	onAddGoal,
	onMoveSurplus,
	onDismissSurplus,
}: Props) {
	const surplus = model && !surplusDismissed ? model.surplus : null;

	return (
		<View className="flex-1">
			<ScrollView
				className="flex-1"
				contentContainerClassName="grow pb-8"
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

				<View className="flex-row items-baseline justify-between">
					<Text className="font-newsreader text-[27px] leading-8 text-foreground">Ahorro</Text>
					{model ? (
						<Text
							className={`font-geist-mono text-[11px] tracking-[0.12em] tabular-nums ${
								model.totalMuted ? "text-[#B6B2A8]" : "text-[#8C8880]"
							}`}
						>
							{`TOTAL ${model.totalLabel}`}
						</Text>
					) : null}
				</View>

				{model ? (
					<Text className="mt-2 max-w-[300px] font-hanken text-[14px] leading-[21px] text-[#6B6B6B]">
						{model.cycleSubtitle}
					</Text>
				) : null}

				{status === "loading" ? (
					<Text className="mt-6 font-hanken text-[15px] text-foreground/55">Cargando…</Text>
				) : null}

				{model ? <FundCard fund={model.fund} /> : null}

				{model ? (
					<GoalsSection
						goals={model.goals}
						canCreateGoal={model.canCreateGoal}
						onAddGoal={onAddGoal}
					/>
				) : null}

				{surplus ? (
					<SurplusBanner
						amountLabel={surplus.amountLabel}
						moving={movingSurplus}
						error={moveError}
						onMove={onMoveSurplus}
						onDismiss={onDismissSurplus}
					/>
				) : null}
			</ScrollView>
		</View>
	);
}

function FundCard({ fund }: { fund: FundView }) {
	if (fund.pending) {
		return (
			<View
				testID="savings-fund"
				className="mt-[26px] rounded-2xl border border-dashed border-[#DEDBD2] px-5 py-5"
			>
				<View className="flex-row items-center gap-[9px]">
					<Lock size={17} color="#B6B2A8" />
					<Text className="font-hanken-semibold text-[15px] text-[#8C8880]">{fund.label}</Text>
				</View>
				<Amount amountBody={fund.amountBody} symbol={fund.symbol} muted />
				<Text className="mt-2 font-hanken text-[13px] leading-5 text-[#6B6B6B]">
					{fund.targetLine}
				</Text>
				<DashedTrack />
			</View>
		);
	}

	return (
		<View testID="savings-fund" className="mt-[26px] rounded-2xl bg-savings/10 px-5 py-5">
			<View className="flex-row items-center gap-[9px]">
				<Lock size={17} color="#3C7D6E" />
				<Text className="font-hanken-semibold text-[15px] text-foreground">{fund.label}</Text>
				<Text className="ml-auto font-geist-mono text-[10.5px] tracking-[0.1em] text-primary">
					PRIORIDAD
				</Text>
			</View>
			<Amount amountBody={fund.amountBody} symbol={fund.symbol} muted={false} />
			{fund.targetLine ? (
				<Text className="mt-2 font-hanken text-[13px] text-[#6B6B6B]">{fund.targetLine}</Text>
			) : null}
			<SavingsBar
				percent={fund.percent}
				label={`Avance del fondo, ${fund.percent} por ciento`}
				trackClass="mt-4 h-[5px] bg-[#E4E1D9]"
			/>
			{fund.monthsLine || fund.cycleLine ? (
				<View className="mt-2.5 flex-row items-center justify-between gap-3">
					{fund.monthsLine ? (
						<Text className="flex-1 font-geist-mono text-[11.5px] text-[#6B6B6B]">
							{fund.monthsLine}
						</Text>
					) : (
						<View className="flex-1" />
					)}
					{fund.cycleLine ? (
						<Text className="font-geist-mono text-[11.5px] text-[#6B6B6B] tabular-nums">
							{fund.cycleLine}
						</Text>
					) : null}
				</View>
			) : null}
		</View>
	);
}

function Amount({
	symbol,
	amountBody,
	muted,
}: {
	symbol: string;
	amountBody: string;
	muted: boolean;
}) {
	const color = muted ? "text-[#CFCBC0]" : "text-foreground";
	const symbolColor = muted ? "text-[#CFCBC0]" : "text-[#6B6B6B]";
	return (
		<View className="mt-4 flex-row items-baseline gap-2">
			<Text className={`font-newsreader text-[17px] leading-none ${symbolColor}`}>{symbol}</Text>
			<Text className={`font-newsreader text-[42px] leading-none tabular-nums ${color}`} selectable>
				{amountBody}
			</Text>
		</View>
	);
}

function DashedTrack() {
	return (
		<View className="mt-4 h-[5px] flex-row gap-1.5 overflow-hidden">
			{DASHES.map((dash) => (
				<View key={dash} className="h-[5px] w-1.5 rounded-[1px] bg-[#E4E1D9]" />
			))}
		</View>
	);
}

function SurplusBanner({
	amountLabel,
	moving,
	error,
	onMove,
	onDismiss,
}: {
	amountLabel: string;
	moving: boolean;
	error: string | null;
	onMove: () => void;
	onDismiss: () => void;
}) {
	return (
		<View className="mt-[22px] border-l-2 border-[#3C7D6E] pl-[14px]">
			<Text className="font-newsreader text-[15px] leading-[22px] text-foreground">
				{`Tienes ~${amountLabel} de ingreso extra este ciclo. ¿Los mando al Fondo?`}
			</Text>
			<View className="mt-2.5 flex-row gap-[18px]">
				<Pressable
					accessibilityRole="button"
					accessibilityLabel="Sí, moverlos"
					accessibilityState={{ disabled: moving }}
					disabled={moving}
					hitSlop={HIT_SLOP}
					onPress={onMove}
					className="active:opacity-60"
				>
					<Text className="font-hanken-semibold text-[13px] text-primary">
						{moving ? "Moviendo…" : "Sí, moverlos"}
					</Text>
				</Pressable>
				<Pressable
					accessibilityRole="button"
					accessibilityLabel="Ahora no"
					hitSlop={HIT_SLOP}
					onPress={onDismiss}
					className="active:opacity-60"
				>
					<Text className="font-hanken-semibold text-[13px] text-[#8C8880]">Ahora no</Text>
				</Pressable>
			</View>
			{error ? <ErrorText message={error} /> : null}
		</View>
	);
}

function GoalsSection({
	goals,
	canCreateGoal,
	onAddGoal,
}: {
	goals: GoalView[];
	canCreateGoal: boolean;
	onAddGoal: () => void;
}) {
	const showAdd = canCreateGoal;

	return (
		<View className="mt-[26px]">
			<View className="flex-row items-baseline justify-between">
				<Text className="font-geist-mono text-[10.5px] tracking-[0.14em] text-[#6B6B6B]">
					TUS METAS
				</Text>
				{showAdd ? (
					<Pressable
						accessibilityRole="button"
						accessibilityLabel="Nueva meta"
						hitSlop={HIT_SLOP}
						onPress={onAddGoal}
						className="active:opacity-60"
					>
						<Text className="font-hanken-semibold text-[13px] text-primary">+ Nueva meta</Text>
					</Pressable>
				) : null}
			</View>

			{goals.length === 0 ? (
				<View className="mt-[30px]">
					<Text className="font-geist-mono text-[10.5px] tracking-[0.14em] text-[#B6B2A8]">
						SIN METAS
					</Text>
					<Text className="mt-3.5 font-newsreader text-[23px] leading-8 text-foreground">
						Tus metas vivirán aquí.
					</Text>
					<Text className="mt-3 max-w-[300px] font-hanken text-[14.5px] leading-6 text-[#6B6B6B]">
						Un viaje, una laptop, la inicial del depa. Primero dale tracción al Fondo; las metas
						vienen después.
					</Text>
					{canCreateGoal ? (
						<Pressable
							accessibilityRole="button"
							accessibilityLabel="Crear mi primera meta"
							onPress={onAddGoal}
							className="mt-[22px] self-start rounded-xl border border-[#DAD7CE] px-[22px] py-3.5 active:opacity-60"
						>
							<Text className="font-hanken-semibold text-[14px] text-foreground">
								Crear mi primera meta
							</Text>
						</Pressable>
					) : null}
				</View>
			) : (
				<View className="mt-4 gap-4">
					{goals.map((goal) => (
						<GoalRow key={goal.id} goal={goal} />
					))}
				</View>
			)}
		</View>
	);
}

function GoalRow({ goal }: { goal: GoalView }) {
	return (
		<View className="border-b border-[#E8E6DF] pb-4">
			<View className="flex-row items-baseline justify-between gap-3">
				<Text className="min-w-0 flex-1 font-hanken text-[15px] text-foreground" numberOfLines={1}>
					{goal.name}
				</Text>
				<View className="flex-row items-baseline gap-1">
					<Text className="font-hanken text-[13.5px] text-foreground tabular-nums" selectable>
						{goal.currentLabel}
					</Text>
					{goal.targetLabel ? (
						<Text className="font-hanken text-[13.5px] text-[#B6B2A8] tabular-nums">
							{goal.targetLabel}
						</Text>
					) : null}
				</View>
			</View>
			{goal.percent != null ? (
				<SavingsBar
					percent={goal.percent}
					label={`Avance de ${goal.name}, ${goal.percent} por ciento`}
					trackClass="mt-3 h-1 bg-[#EDEBE4]"
				/>
			) : null}
			<Text className="mt-[9px] font-geist-mono text-[11.5px] text-[#8C8880]">{goal.footer}</Text>
		</View>
	);
}

function SavingsBar({
	percent,
	label,
	trackClass,
}: {
	percent: number;
	label: string;
	trackClass: string;
}) {
	return (
		<View
			accessibilityRole="progressbar"
			accessibilityLabel={label}
			accessibilityValue={{ min: 0, max: 100, now: percent }}
			className={`overflow-hidden rounded-[3px] ${trackClass}`}
		>
			{/* El avance es un % de datos: Uniwind no tiene clase para ese ancho. */}
			<View className="h-full bg-savings" style={{ width: `${percent}%` }} />
		</View>
	);
}
