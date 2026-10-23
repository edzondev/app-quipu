import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, Vibration, View } from "react-native";
import Animated, { Easing, FadeIn, FadeInDown } from "react-native-reanimated";
import {
	addSource,
	getInstalledBanks,
	getSources,
	type InstalledBank,
	isNotificationAccessEnabled,
	openNotificationAccessSettings,
	parsePlayStoreLink,
} from "@/modules/quipu-notification-listener";
import { ErrorText } from "@/shared/components/forms/field-error";
import { SectionLabel } from "@/shared/components/section-label";
import { Check, ChevronLeft } from "@/shared/components/ui/reicon";
import { HIT_SLOP } from "@/shared/lib/hit-slop";

const NOT_A_BANK_LINK =
	"Este link no es de un banco en Play Store. Cópialo desde la app de tu banco.";
const EASE = Easing.bezier(0.23, 1, 0.32, 1);
const CARD_ENTER = FadeInDown.duration(200)
	.easing(EASE)
	.withInitialValues({ opacity: 0, transform: [{ translateY: 6 }] });
const ERROR_ENTER = FadeIn.duration(150).easing(EASE);
const mono = "font-geist-mono text-[10.5px] tracking-[0.14em]";

function mark(name: string) {
	const word = name.trim().split(/\s+/)[0] ?? "";
	const head = word.toLocaleLowerCase("es-PE").includes("bank") ? `${word[0]}B` : word.slice(0, 2);
	return head.toLocaleUpperCase("es-PE");
}

export function ExpenseDetectionScreen({ onClose }: { onClose: () => void }) {
	const catalog = useRef<InstalledBank[]>([]);
	const [banks, setBanks] = useState<InstalledBank[]>([]);
	const [text, setText] = useState("");
	const [rejected, setRejected] = useState(false);
	const textRef = useRef("");
	const buzz = useRef<"ok" | "bad" | null>(null);
	const parsed = parsePlayStoreLink(text);
	const packageId = "packageId" in parsed ? parsed.packageId : "";
	const shown = banks.find((bank) => bank.packageId === packageId);
	const border = shown ? "border-primary" : rejected ? "border-danger" : "border-line";
	const canContinue = banks.length > 0;

	useEffect(() => {
		void Promise.all([getInstalledBanks(), getSources()]).then(([rows, ids]) => {
			catalog.current = rows;
			setBanks(ids.flatMap((id) => rows.filter((item) => item.packageId === id)));
		});
	}, []);

	function buzzOnce(kind: "ok" | "bad") {
		if (kind === "bad" && buzz.current === "bad") return;
		buzz.current = kind;
		Vibration.vibrate(kind === "ok" ? 20 : 30);
	}

	function onLinkChange(next: string) {
		textRef.current = next;
		setText(next);
		const link = next.trim() === "" ? null : parsePlayStoreLink(next);
		const bank =
			link && "packageId" in link
				? catalog.current.find((item) => item.packageId === link.packageId)
				: undefined;
		if (!bank) {
			setRejected(link !== null);
			if (link === null) buzz.current = null;
			else buzzOnce("bad");
			return;
		}
		setRejected(false);
		if (banks.some((item) => item.packageId === bank.packageId)) return;
		if (buzz.current === "bad") buzz.current = null;
		void addSource(next).then((result) => {
			if (result !== "added" && result !== "already_added") {
				if (textRef.current !== next) return;
				setRejected(true);
				buzzOnce("bad");
				return;
			}
			setBanks((list) =>
				list.some((item) => item.packageId === bank.packageId) ? list : [...list, bank],
			);
			if (textRef.current === next) buzzOnce("ok");
		});
	}

	return (
		<View className="flex-1">
			<View className="flex-row items-center">
				<Pressable
					accessibilityRole="button"
					accessibilityLabel="Volver"
					hitSlop={HIT_SLOP}
					onPress={onClose}
					className="min-h-11 min-w-11 items-center justify-center active:opacity-60"
				>
					<ChevronLeft size={22} colorClassName="accent-foreground" />
				</Pressable>
				<Text className={`ml-1 flex-1 text-foreground/55 ${mono}`}>DETECCIÓN DE GASTOS</Text>
			</View>
			<ScrollView
				className="flex-1"
				keyboardShouldPersistTaps="handled"
				showsVerticalScrollIndicator={false}
			>
				<Text className="mt-6 font-newsreader text-[27px] leading-8 text-foreground">
					Conecta tu banco
				</Text>
				<Text className="mt-2 font-hanken text-[14.5px] leading-6 text-foreground/55">
					En Play Store, abre tu banco, toca Compartir y copia el link.
				</Text>
				<SectionLabel className="mt-[30px] mb-3">LINK DE TU BANCO</SectionLabel>
				<View className={`border-b-2 ${border}`}>
					<TextInput
						value={text}
						onChangeText={onLinkChange}
						accessibilityLabel="Link de tu banco"
						autoFocus
						autoCapitalize="none"
						autoCorrect={false}
						keyboardType="url"
						placeholder="Mantén presionado y pega el link"
						placeholderTextColorClassName="accent-foreground/45"
						className="h-11 w-full font-hanken text-[15px] text-foreground"
					/>
				</View>
				{rejected ? (
					<Animated.View entering={ERROR_ENTER}>
						<ErrorText message={NOT_A_BANK_LINK} />
					</Animated.View>
				) : null}
				{banks.map((bank) => (
					<Animated.View key={bank.packageId} entering={CARD_ENTER}>
						<View className="mt-4 flex-row items-center gap-3 rounded-2xl border border-line px-3.5 py-3">
							<View className="size-11 items-center justify-center rounded-xl bg-primary">
								<Text className="font-hanken-semibold text-[15px] text-background">
									{mark(bank.name)}
								</Text>
							</View>
							<View className="min-w-0 flex-1">
								<Text className="font-hanken-semibold text-[16px] text-foreground">
									{bank.name}
								</Text>
								<Text className={`mt-1 text-foreground/45 ${mono}`}>BANCO DETECTADO</Text>
							</View>
							<View className="size-6 items-center justify-center rounded-full bg-primary">
								<Check size={14} colorClassName="accent-background" />
							</View>
						</View>
						{shown?.packageId === bank.packageId ? (
							<Text className="mt-3 font-hanken text-[14.5px] text-primary">
								{`Listo, detectamos ${bank.name}.`}
							</Text>
						) : null}
					</Animated.View>
				))}
			</ScrollView>
			<Pressable
				accessibilityRole="button"
				accessibilityLabel="Siguiente"
				disabled={!canContinue}
				onPress={() =>
					isNotificationAccessEnabled() ? onClose() : openNotificationAccessSettings()
				}
				className={`mt-3 items-center justify-center rounded-xl py-4 ${canContinue ? "bg-foreground active:opacity-80" : "bg-line"}`}
			>
				<Text
					className={`font-hanken-semibold text-[15px] ${canContinue ? "text-background" : "text-foreground/40"}`}
				>
					Siguiente
				</Text>
			</Pressable>
		</View>
	);
}
