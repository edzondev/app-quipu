import type { ReactNode } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import SignOutButton from "@/shared/components/auth/sign-out-button";
import type { BadgeTone, HomeModel, HomeTone } from "@/shared/lib/dashboard/home-model";
import { formatCents, formatCentsTrimmed } from "@/shared/lib/money";

const TONE_FILL: Record<"needs" | "wants" | "savings", string> = {
	needs: "bg-needs",
	wants: "bg-wants",
	savings: "bg-savings",
};

const MOVEMENT_DOT: Record<HomeTone, string> = {
	needs: "bg-needs",
	wants: "bg-wants",
	savings: "bg-savings",
	income: "bg-stable",
};

const STATUS_TEXT: Record<BadgeTone, string> = {
	stable: "text-stable",
	attention: "text-warning",
	risk: "text-danger",
	starting: "text-foreground/55",
};

const VISIBLE_COMMITMENTS = 3;
const TRACK = "bg-[#EDEBE4]";
const ROW_RULE = "border-[#F0EEE8]";

function SectionLabel({ children }: { children: ReactNode }) {
	return (
		<Text className="font-geist-mono text-[10.5px] uppercase tracking-[0.14em] text-foreground/55">
			{children}
		</Text>
	);
}

function HeroAmount({ cents, symbol }: { cents: number; symbol: string }) {
	const negative = cents < 0;
	const [intPart, decPart] = (Math.abs(cents) / 100).toFixed(2).split(".");
	const grouped = (intPart ?? "0").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
	return (
		<Text className="font-newsreader text-foreground" selectable>
			<Text className="font-newsreader text-[18px] text-foreground/55">
				{negative ? "-" : ""}
				{symbol}{" "}
			</Text>
			<Text className="font-newsreader text-[52px] leading-[54px] tracking-tight text-foreground">
				{grouped}
			</Text>
			<Text className="font-newsreader text-[24px] text-foreground/45">.{decPart}</Text>
		</Text>
	);
}

export function HomeDense({
	home,
	onViewAllMovements,
}: {
	home: HomeModel;
	onViewAllMovements: () => void;
}) {
	const commitments = home.commitments.slice(0, VISIBLE_COMMITMENTS);
	const statusClass = STATUS_TEXT[home.badgeTone];

	return (
		<ScrollView
			className="flex-1"
			contentInsetAdjustmentBehavior="automatic"
			contentContainerClassName="pb-8"
			showsVerticalScrollIndicator={false}
		>
			<View className="border-b border-line pb-6 pt-1">
				<Text className="font-newsreader text-[22px] leading-[28px] tracking-tight text-foreground">
					Hoy puedes gastar
				</Text>
				<View className="mt-2">
					<HeroAmount cents={home.dailyCents} symbol={home.currencySymbol} />
				</View>
				{home.heroSubtitle ? (
					<Text className="mt-2.5 font-hanken text-[14px] leading-[20px] text-foreground/55">
						{home.heroSubtitle}
					</Text>
				) : null}
				<Text className="mt-2.5 font-hanken text-[13px] leading-[18px] text-foreground/45">
					Día {home.cycleDay}/{home.cycleTotal}
					{" · "}
					<Text className={`font-hanken-semibold text-[13px] ${statusClass}`}>
						{home.cycleStatusLabel}
					</Text>
					{" · Sobra "}
					{formatCentsTrimmed(home.surplusCents, home.currencySymbol)}
				</Text>
			</View>

			<View className="border-b border-line pb-4 pt-5">
				<SectionLabel>Sobres · queda</SectionLabel>
				<View className="mt-3.5 gap-3">
					{home.envelopes.map((envelope) => (
						<View key={envelope.label} className="flex-row items-center gap-3">
							<Text className="w-[66px] font-hanken-semibold text-[13.5px] text-foreground">
								{envelope.shortLabel}
							</Text>
							<View className={`h-1 flex-1 overflow-hidden rounded-full ${TRACK}`}>
								<View
									className={`h-full rounded-full ${TONE_FILL[envelope.tone]}`}
									style={{ width: `${envelope.remainingPercent}%` }}
								/>
							</View>
							<Text
								className="w-[78px] text-right font-hanken text-[13.5px] text-foreground"
								style={{ fontVariant: ["tabular-nums"] }}
								selectable
							>
								{formatCentsTrimmed(envelope.remainingCents, home.currencySymbol)}
							</Text>
						</View>
					))}
				</View>
			</View>

			<View className="border-b border-line pb-3.5 pt-[15px]">
				<View className="mb-1 flex-row items-baseline justify-between">
					<SectionLabel>Próximos compromisos</SectionLabel>
					<Text className="font-geist-mono text-[11.5px] text-foreground/45">
						{home.commitments.length}
					</Text>
				</View>
				{commitments.length === 0 ? (
					<Text className="py-2 font-hanken text-[14px] text-foreground/55">
						Sin compromisos próximos.
					</Text>
				) : (
					commitments.map((commitment) => (
						<View key={commitment.id} className="flex-row items-center justify-between py-[7px]">
							<Text className="flex-1 pr-3 font-hanken-semibold text-[14px] text-foreground">
								{commitment.name}
								<Text
									className={`font-hanken text-[14px] ${
										commitment.dueTone === "soon" ? "text-warning" : "text-foreground/45"
									}`}
								>
									{" "}
									· {commitment.dueLabel}
								</Text>
							</Text>
							<Text
								className="font-hanken text-[14px] text-foreground"
								style={{ fontVariant: ["tabular-nums"] }}
								selectable
							>
								{formatCentsTrimmed(commitment.amountCents, home.currencySymbol)}
							</Text>
						</View>
					))
				)}
			</View>

			<View className="pt-[15px]">
				<View className="mb-1.5 flex-row items-baseline justify-between">
					<SectionLabel>Movimientos</SectionLabel>
					<Pressable hitSlop={8} onPress={onViewAllMovements}>
						<Text className="font-hanken-semibold text-[12.5px] text-stable">Ver todos</Text>
					</Pressable>
				</View>
				{home.recentMovements.length === 0 ? (
					<Text className="py-2 font-hanken text-[14px] text-foreground/55">
						Sin movimientos en este ciclo.
					</Text>
				) : (
					home.recentMovements.map((movement, index) => {
						const isLast = index === home.recentMovements.length - 1;
						const inbound = movement.tone === "income";
						return (
							<View
								key={movement.id}
								className={`flex-row items-center justify-between py-[9px] ${
									isLast ? "" : `border-b ${ROW_RULE}`
								}`}
							>
								<View className="flex-1 flex-row items-center gap-2.5 pr-3">
									<View className={`h-1.5 w-1.5 rounded-full ${MOVEMENT_DOT[movement.tone]}`} />
									<Text className="flex-1 font-hanken-semibold text-[14px] text-foreground">
										{movement.name}
									</Text>
								</View>
								<Text
									className={`font-hanken-semibold text-[14px] ${
										inbound ? "text-stable" : "text-foreground"
									}`}
									style={{ fontVariant: ["tabular-nums"] }}
									selectable
								>
									{inbound ? "+" : "−"} {formatCents(movement.amountCents, home.currencySymbol)}
								</Text>
							</View>
						);
					})
				)}
			</View>

			<View className="mt-6 items-start">
				<SignOutButton />
			</View>
		</ScrollView>
	);
}
