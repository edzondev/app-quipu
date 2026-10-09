import { Pressable, ScrollView, Text, View } from "react-native";
import { ChevronLeft } from "@/shared/components/ui/reicon";
import { HIDDEN_UNTIL_READY } from "@/shared/hidden-until-ready";
import type {
	SobresEnvelopeView,
	SobresScreenModel,
	SobresStatusTone,
	SobresTone,
} from "@/shared/lib/dashboard/sobres-model";
import { HIT_SLOP } from "@/shared/lib/hit-slop";

const SUBTITLE = "Tu sueldo ya está dividido. Esto es lo que queda.";
const EMPTY = "Todavía no hay sobres en el ciclo activo.";

const DOT: Record<SobresTone, string> = {
	needs: "bg-needs",
	wants: "bg-wants",
	savings: "bg-savings",
};

const STATUS: Record<SobresStatusTone, string> = {
	calm: "text-primary",
	fast: "text-warning",
};

type Props = {
	status: "loading" | "empty" | "ready";
	screen: SobresScreenModel | null;
	onBack: () => void;
	onMoveMoney: () => void;
	onRegisterExpense: () => void;
};

export function SobresScreen({ status, screen, onBack, onMoveMoney, onRegisterExpense }: Props) {
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
					<ChevronLeft size={22} colorClassName="accent-foreground" />
				</Pressable>
				<View className="flex-row items-baseline justify-between">
					<Text className="font-newsreader text-[27px] leading-8 text-foreground">Sobres</Text>
					{screen ? (
						<Text className="font-geist-mono text-[11px] tracking-[0.12em] text-foreground/45">
							{screen.dayLabel}
						</Text>
					) : null}
				</View>

				{status === "loading" ? (
					<Text className="mt-6 font-hanken text-[15px] text-foreground/55">Cargando…</Text>
				) : null}
				{status === "empty" ? (
					<Text className="mt-6 font-hanken text-[15px] text-foreground/55">{EMPTY}</Text>
				) : null}

				{screen ? (
					<>
						<Text className="mt-2 font-hanken text-[14px] leading-[21px] text-foreground/55">
							{SUBTITLE}
						</Text>
						<View>
							{screen.envelopes.map((envelope, index) => (
								<EnvelopeBlock
									key={envelope.tone}
									envelope={envelope}
									isFirst={index === 0}
									isLast={index === screen.envelopes.length - 1}
								/>
							))}
						</View>
					</>
				) : null}
			</ScrollView>

			{screen ? (
				<View className="flex-row gap-2.5 pt-4">
					{HIDDEN_UNTIL_READY.moveMoney ? null : (
						<Pressable
							accessibilityRole="button"
							className="flex-1 items-center rounded-xl border border-[#DAD7CE] py-3.5"
							onPress={onMoveMoney}
						>
							<Text className="font-hanken-semibold text-[14px] text-foreground">Mover dinero</Text>
						</Pressable>
					)}
					<Pressable
						accessibilityRole="button"
						className="flex-1 items-center rounded-xl bg-foreground py-3.5"
						onPress={onRegisterExpense}
					>
						<Text className="font-hanken-semibold text-[14px] text-background">
							Registrar gasto
						</Text>
					</Pressable>
				</View>
			) : null}
		</View>
	);
}

function EnvelopeBlock({
	envelope,
	isFirst,
	isLast,
}: {
	envelope: SobresEnvelopeView;
	isFirst: boolean;
	isLast: boolean;
}) {
	const rule = isLast ? "" : "border-b border-line pb-[22px]";
	return (
		<View className={`${isFirst ? "mt-[26px]" : "mt-[22px]"} ${rule}`}>
			<View className="flex-row items-center gap-[9px]">
				<View className={`h-[7px] w-[7px] rounded-full ${DOT[envelope.tone]}`} />
				<Text className="font-hanken-semibold text-[15px] text-foreground">{envelope.label}</Text>
				{envelope.statusLabel ? (
					<Text
						className={`ml-auto font-hanken-semibold text-[11px] ${STATUS[envelope.statusTone]}`}
					>
						{envelope.statusLabel}
					</Text>
				) : null}
			</View>

			<View className="mt-3 flex-row items-baseline gap-1.5">
				<Text className="font-newsreader text-[16px] text-foreground/55">
					{envelope.negative ? "-" : ""}
					{envelope.symbol}
				</Text>
				<Text className="font-newsreader text-[38px] tracking-tight text-foreground" selectable>
					{envelope.amountLabel}
				</Text>
				<Text className="ml-1 font-hanken text-[13px] text-foreground/45">
					{envelope.budgetLabel}
				</Text>
			</View>

			<View
				accessibilityRole="progressbar"
				accessibilityLabel={envelope.label}
				accessibilityValue={{ min: 0, max: 100, now: envelope.progress }}
				className="mt-3.5 h-1 overflow-hidden rounded-[2px] bg-[#EDEBE4]"
			>
				<View
					className={`h-full rounded-[2px] ${DOT[envelope.tone]}`}
					style={{ width: `${envelope.progress}%` }}
				/>
			</View>

			{envelope.footLeft || envelope.footRight ? (
				<View className="mt-[9px] flex-row items-center">
					<Text
						className="flex-1 font-geist-mono text-[11.5px] text-foreground/45"
						numberOfLines={1}
					>
						{envelope.footLeft ?? ""}
					</Text>
					{envelope.footRight ? (
						<Text
							className={`ml-3 font-geist-mono text-[11.5px] ${
								envelope.footRightTone === "fast" ? "text-warning" : "text-foreground/45"
							}`}
						>
							{envelope.footRight}
						</Text>
					) : null}
				</View>
			) : null}
		</View>
	);
}
