import { Pressable, ScrollView, Text, View } from "react-native";
import { ChevronLeft } from "reicon-react-native/icons/ChevronLeft";
import { Lock } from "reicon-react-native/icons/Lock";
import { HIT_SLOP } from "@/shared/lib/hit-slop";
import type { AhorroScreenModel, FundView, GoalView } from "@/shared/lib/savings/model";

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
						<Text className="font-geist-mono text-[11px] tracking-[0.12em] text-foreground/45 tabular-nums">
							{`TOTAL ${model.totalLabel}`}
						</Text>
					) : null}
				</View>

				{model ? (
					<Text className="mt-2 max-w-[300px] font-hanken text-[14px] leading-[21px] text-foreground/55">
						{model.cycleSubtitle}
					</Text>
				) : null}

				{status === "loading" ? (
					<Text className="mt-6 font-hanken text-[15px] text-foreground/55">Cargando…</Text>
				) : null}

				{model?.empty ? (
					<EmptySavings canCreateGoal={model.canCreateGoal} onAddGoal={onAddGoal} />
				) : null}

				{model && !model.empty && model.fund ? <FundCard fund={model.fund} /> : null}

				{surplus ? (
					<SurplusBanner
						amountLabel={surplus.amountLabel}
						moving={movingSurplus}
						error={moveError}
						onMove={onMoveSurplus}
						onDismiss={onDismissSurplus}
					/>
				) : null}

				{model && !model.empty ? (
					<GoalsSection
						goals={model.goals}
						canCreateGoal={model.canCreateGoal}
						onAddGoal={onAddGoal}
					/>
				) : null}
			</ScrollView>
		</View>
	);
}

function EmptySavings({
	canCreateGoal,
	onAddGoal,
}: {
	canCreateGoal: boolean;
	onAddGoal: () => void;
}) {
	return (
		<View className="mt-10">
			<Text className="font-geist-mono text-[10.5px] tracking-[0.14em] text-foreground/35">
				SIN AHORRO
			</Text>
			<Text className="mt-3.5 font-newsreader text-[23px] leading-8 text-foreground">
				El fondo va primero.
			</Text>
			<Text className="mt-3 max-w-[300px] font-hanken text-[14.5px] leading-6 text-foreground/55">
				Aparece cuando terminas de armar tu sistema. Las metas se suman después.
			</Text>
			{canCreateGoal ? (
				<Pressable
					accessibilityRole="button"
					accessibilityLabel="Nueva meta"
					onPress={onAddGoal}
					className="mt-[22px] self-start rounded-xl bg-foreground px-[22px] py-3.5 active:opacity-80"
				>
					<Text className="font-hanken-semibold text-[14px] text-background">Nueva meta</Text>
				</Pressable>
			) : null}
		</View>
	);
}

function FundCard({ fund }: { fund: FundView }) {
	return (
		<View className="mt-6 rounded-2xl border border-line px-4 py-[18px]">
			<View className="flex-row items-center gap-2">
				<Lock size={14} color="#5E8C79" />
				<Text className="font-hanken-semibold text-[15px] text-foreground">{fund.label}</Text>
			</View>
			<Text
				className="mt-3 font-newsreader text-[34px] leading-none text-foreground tabular-nums"
				selectable
			>
				{fund.amountLabel}
			</Text>
			<Text className="mt-2 font-hanken text-[13px] text-foreground/55">{fund.targetLine}</Text>
			<SavingsBar percent={fund.percent} label={`Avance del fondo, ${fund.percent} por ciento`} />
			{fund.monthsLine || fund.cycleLine ? (
				<View className="mt-[9px] flex-row items-center justify-between gap-3">
					{fund.monthsLine ? (
						<Text className="flex-1 font-geist-mono text-[11px] tracking-[0.04em] text-primary">
							{fund.monthsLine}
						</Text>
					) : (
						<View className="flex-1" />
					)}
					{fund.cycleLine ? (
						<Text className="font-geist-mono text-[11px] text-foreground/55 tabular-nums">
							{fund.cycleLine}
						</Text>
					) : null}
				</View>
			) : null}
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
		<View className="mt-4 rounded-xl border border-line px-4 py-3.5">
			<Text className="font-hanken text-[14px] leading-5 text-foreground">
				{`Tienes ~${amountLabel} de ingreso extra este ciclo. ¿Los mando al Fondo?`}
			</Text>
			<View className="mt-3 flex-row gap-2">
				<Pressable
					accessibilityRole="button"
					accessibilityLabel="Sí, moverlos"
					accessibilityState={{ disabled: moving }}
					disabled={moving}
					onPress={onMove}
					className={`rounded-xl bg-foreground px-4 py-2.5 active:opacity-80 ${
						moving ? "opacity-60" : ""
					}`}
				>
					<Text className="font-hanken-semibold text-[13px] text-background">
						{moving ? "Moviendo…" : "Sí, moverlos"}
					</Text>
				</Pressable>
				<Pressable
					accessibilityRole="button"
					accessibilityLabel="Ahora no"
					hitSlop={HIT_SLOP}
					onPress={onDismiss}
					className="rounded-xl border border-[#DAD7CE] px-4 py-2.5 active:opacity-60"
				>
					<Text className="font-hanken-semibold text-[13px] text-foreground">Ahora no</Text>
				</Pressable>
			</View>
			{error ? <Text className="mt-2 font-hanken text-[13px] text-danger">{error}</Text> : null}
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
	return (
		<View className="mt-7">
			<View className="flex-row items-center justify-between">
				<Text className="font-geist-mono text-[10.5px] tracking-[0.14em] text-foreground/55">
					TUS METAS
				</Text>
				{canCreateGoal ? (
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
				<View className="mt-4">
					<Text className="font-newsreader text-[20px] leading-7 text-foreground">
						Aún no tienes metas.
					</Text>
					<Text className="mt-2 max-w-[300px] font-hanken text-[14px] leading-5 text-foreground/55">
						Las agregas cuando quieras. El fondo sigue primero.
					</Text>
				</View>
			) : (
				<View className="mt-2">
					{goals.map((goal, index) => (
						<GoalRow key={goal.id} goal={goal} isLast={index === goals.length - 1} />
					))}
				</View>
			)}
		</View>
	);
}

function GoalRow({ goal, isLast }: { goal: GoalView; isLast: boolean }) {
	return (
		<View className={`py-4 ${isLast ? "" : "border-b border-[#F0EEE8]"}`}>
			<View className="flex-row items-baseline justify-between gap-3">
				<Text
					className="min-w-0 flex-1 font-hanken-semibold text-[15px] text-foreground"
					numberOfLines={1}
				>
					{goal.name}
				</Text>
				<Text className="font-hanken text-[13px] text-foreground/55 tabular-nums" selectable>
					{goal.amountLine}
				</Text>
			</View>
			<SavingsBar
				percent={goal.percent}
				label={`Avance de ${goal.name}, ${goal.percent} por ciento`}
			/>
			<Text className="mt-[9px] font-geist-mono text-[11px] text-foreground/45">{goal.footer}</Text>
		</View>
	);
}

function SavingsBar({ percent, label }: { percent: number; label: string }) {
	return (
		<View
			accessibilityRole="progressbar"
			accessibilityLabel={label}
			accessibilityValue={{ min: 0, max: 100, now: percent }}
			className="mt-3.5 h-[5px] overflow-hidden rounded-[3px] bg-[#E4E1D9]"
		>
			{/* El avance es un % de datos: Uniwind no tiene clase para ese ancho. */}
			<View className="h-full bg-savings" style={{ width: `${percent}%` }} />
		</View>
	);
}
