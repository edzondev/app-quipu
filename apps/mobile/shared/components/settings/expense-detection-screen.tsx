import { useEffect, useEffectEvent, useRef, useState } from "react";
import {
	AppState,
	Clipboard,
	Pressable,
	ScrollView,
	Text,
	TextInput,
	Vibration,
	View,
} from "react-native";
import Animated, { Easing, FadeIn, FadeInDown } from "react-native-reanimated";
import {
	addSource,
	getInstalledBanks,
	getSources,
	isNotificationAccessEnabled,
	openNotificationAccessSettings,
	parsePlayStoreLink,
} from "@/modules/quipu-notification-listener";
import { ErrorText } from "@/shared/components/forms/field-error";
import { SectionLabel } from "@/shared/components/section-label";
import { InlineLoading } from "@/shared/components/ui/inline-loading";
import { Check, ChevronLeft } from "@/shared/components/ui/reicon";
import { useHardwareBack } from "@/shared/hooks/use-hardware-back";
import { HIT_SLOP } from "@/shared/lib/hit-slop";
import {
	type CatalogBank,
	type DetectedBank,
	provisionalMark,
	readLink,
	savedBanks,
	sourceAccepted,
} from "@/shared/lib/settings/bank-link";

const NOT_A_BANK_LINK =
	"Este link no es de un banco en Play Store. Cópialo desde la app de tu banco.";

const CARD_ENTER = FadeInDown.duration(200)
	.easing(Easing.bezier(0.23, 1, 0.32, 1))
	.withInitialValues({ opacity: 0, transform: [{ translateY: 6 }] });

const ERROR_ENTER = FadeIn.duration(150).easing(Easing.bezier(0.23, 1, 0.32, 1));

type Step = "link" | "access";
type Save = { text: string; status: "pending" | "rejected" };

export function ExpenseDetectionScreen({ onClose }: { onClose: () => void }) {
	const [step, setStep] = useState<Step>("link");
	const [ready, setReady] = useState(false);
	const [catalog, setCatalog] = useState<CatalogBank[]>([]);
	const [banks, setBanks] = useState<DetectedBank[]>([]);
	const [text, setText] = useState("");
	const [save, setSave] = useState<Save | null>(null);
	const alive = useRef(true);
	const textRef = useRef("");
	const buzz = useRef<"ok" | "bad" | null>(null);

	function goBack() {
		if (step === "access") {
			setStep("link");
			return;
		}
		onClose();
	}

	useHardwareBack(goBack);

	const leaveIfGranted = useEffectEvent(() => {
		if (step !== "access" || !isNotificationAccessEnabled()) return;
		onClose();
	});

	useEffect(() => {
		alive.current = true;
		void Promise.all([getInstalledBanks(), getSources()])
			.then(([rows, ids]) => {
				if (!alive.current) return;
				setCatalog(rows);
				setBanks(savedBanks(ids, rows));
				setReady(true);
			})
			.catch(() => {
				if (!alive.current) return;
				setReady(true);
			});
		const subscription = AppState.addEventListener("change", (state) => {
			if (state === "active") leaveIfGranted();
		});
		return () => {
			alive.current = false;
			subscription.remove();
		};
	}, []);

	function buzzBad() {
		if (buzz.current === "bad") return;
		buzz.current = "bad";
		Vibration.vibrate(30);
	}

	function buzzOk() {
		buzz.current = "ok";
		Vibration.vibrate(20);
	}

	function onLinkChange(next: string) {
		textRef.current = next;
		setText(next);
		const parsed = next.trim() === "" ? null : parsePlayStoreLink(next);
		const read = readLink(next, parsed, catalog);
		if (read.kind === "empty") {
			buzz.current = null;
			setSave(null);
			return;
		}
		if (read.kind === "invalid") {
			setSave(null);
			buzzBad();
			return;
		}
		if (banks.some((bank) => bank.packageId === read.bank.packageId)) {
			setSave(null);
			return;
		}
		if (buzz.current === "bad") buzz.current = null;
		setSave({ text: next, status: "pending" });
		const bank = read.bank;
		void addSource(next).then(
			(result) => {
				if (!alive.current) return;
				const current = textRef.current === next;
				if (!sourceAccepted(result)) {
					if (!current) return;
					setSave({ text: next, status: "rejected" });
					buzzBad();
					return;
				}
				setBanks((list) =>
					list.some((item) => item.packageId === bank.packageId) ? list : [...list, bank],
				);
				if (!current) return;
				setSave(null);
				buzzOk();
			},
			() => {
				if (!alive.current || textRef.current !== next) return;
				setSave({ text: next, status: "rejected" });
				buzzBad();
			},
		);
	}

	function next() {
		if (banks.length === 0) return;
		if (isNotificationAccessEnabled()) {
			onClose();
			return;
		}
		setStep("access");
	}

	if (!ready) {
		return (
			<View className="flex-1">
				<DetectionHeader onBack={onClose} />
				<InlineLoading />
			</View>
		);
	}

	if (step === "access") {
		return (
			<View className="flex-1">
				<DetectionHeader onBack={goBack} />
				<ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
					<Text className="mt-6 font-geist-mono text-[10.5px] tracking-[0.14em] text-foreground/45">
						ÚLTIMO PASO
					</Text>
					<Text className="mt-3 font-newsreader text-[27px] leading-8 text-foreground">
						Dale permiso a Quipu para ver los avisos.
					</Text>
					<Text className="mt-2 font-hanken text-[14.5px] leading-6 text-foreground/55">
						Android te va a mostrar una lista. Busca Quipu y actívalo.
					</Text>
					<Text className="mt-5 font-geist-mono text-[10.5px] tracking-[0.14em] text-foreground/45">
						ASÍ SE VE EN ANDROID
					</Text>
					<View className="mt-3 rounded-xl border border-line px-4 py-3">
						<Text className="font-hanken-semibold text-[15px] text-foreground">
							Acceso a notificaciones
						</Text>
						<Text className="mt-3 font-hanken text-[15px] text-foreground/45">Otra app</Text>
						<Text className="mt-3 font-hanken-semibold text-[15px] text-foreground">Quipu</Text>
					</View>
					<Text className="mt-3 font-hanken text-[13.5px] leading-5 text-foreground/55">
						Android muestra un mensaje de advertencia general. Es normal: Quipu solo lee los bancos
						que elegiste.
					</Text>
				</ScrollView>
				<View className="gap-2 pt-3">
					<PrimaryButton label="Ir a Ajustes de Android" onPress={openNotificationAccessSettings} />
					<Pressable
						accessibilityRole="button"
						accessibilityLabel="Ahora no"
						onPress={onClose}
						className="min-h-11 items-center justify-center active:opacity-60"
					>
						<Text className="font-hanken text-[13.5px] text-foreground/55">Ahora no</Text>
					</Pressable>
				</View>
			</View>
		);
	}

	const parsed = text.trim() === "" ? null : parsePlayStoreLink(text);
	const read = readLink(text, parsed, catalog);
	const detected =
		read.kind === "bank" && banks.some((bank) => bank.packageId === read.bank.packageId);
	const invalid =
		read.kind === "invalid" ||
		(read.kind === "bank" && save?.text === text && save.status === "rejected" && !detected);
	const border = detected ? "border-primary" : invalid ? "border-danger" : "border-line";

	return (
		<View className="flex-1">
			<DetectionHeader onBack={goBack} />
			<ScrollView
				className="flex-1"
				keyboardShouldPersistTaps="handled"
				showsVerticalScrollIndicator={false}
			>
				<Text className="mt-6 font-newsreader text-[27px] leading-8 text-foreground">
					Conecta tu banco
				</Text>
				<Text className="mt-2 font-hanken text-[14.5px] leading-6 text-foreground/55">
					Abre tu banco en Play Store, toca Compartir y copia el link. Pégalo aquí.
				</Text>
				<View className="mt-[30px]">
					<SectionLabel className="mb-3">Link de tu banco</SectionLabel>
					<View className={`flex-row items-center gap-3 border-b-2 pb-2.5 ${border}`}>
						<TextInput
							value={text}
							onChangeText={onLinkChange}
							accessibilityLabel="Link de tu banco"
							autoCapitalize="none"
							autoCorrect={false}
							keyboardType="url"
							placeholder="Pega aquí el link"
							placeholderTextColorClassName="accent-foreground/45"
							className="min-w-0 flex-1 py-2.5 font-hanken text-[15px] text-foreground"
						/>
						<Pressable
							accessibilityRole="button"
							accessibilityLabel="Pegar"
							hitSlop={HIT_SLOP}
							onPress={() => {
								void Clipboard.getString().then((value) => onLinkChange(value));
							}}
							className="min-h-11 min-w-[76px] items-center justify-center rounded-full border border-line px-[18px] active:opacity-60"
						>
							<Text className="font-hanken-semibold text-[14px] text-foreground">Pegar</Text>
						</Pressable>
					</View>
					{invalid ? (
						<Animated.View entering={ERROR_ENTER}>
							<ErrorText message={NOT_A_BANK_LINK} />
						</Animated.View>
					) : null}
				</View>
				{banks.map((bank) => (
					<Animated.View key={bank.packageId} entering={CARD_ENTER}>
						<View className="mt-4 flex-row items-center gap-3 rounded-2xl border border-line px-3.5 py-3">
							<View className="size-11 items-center justify-center rounded-xl bg-primary">
								<Text className="font-hanken-semibold text-[15px] text-background">
									{provisionalMark(bank.name)}
								</Text>
							</View>
							<View className="min-w-0 flex-1">
								<Text className="font-hanken-semibold text-[16px] text-foreground">
									{bank.name}
								</Text>
								<Text className="mt-1 font-geist-mono text-[10.5px] tracking-[0.14em] text-foreground/45">
									BANCO DETECTADO
								</Text>
							</View>
							<View className="size-6 items-center justify-center rounded-full bg-primary">
								<Check size={14} colorClassName="accent-background" />
							</View>
						</View>
						{detected && read.kind === "bank" && read.bank.packageId === bank.packageId ? (
							<Text className="mt-3 font-hanken text-[14.5px] text-primary">
								{`Listo, detectamos ${bank.name}.`}
							</Text>
						) : null}
					</Animated.View>
				))}
			</ScrollView>
			<View className="pt-3">
				<PrimaryButton label="Siguiente" disabled={banks.length === 0} onPress={next} />
			</View>
		</View>
	);
}

function DetectionHeader({ onBack }: { onBack: () => void }) {
	return (
		<View className="flex-row items-center">
			<Pressable
				accessibilityRole="button"
				accessibilityLabel="Volver"
				hitSlop={HIT_SLOP}
				onPress={onBack}
				className="min-h-11 min-w-11 items-center justify-center active:opacity-60"
			>
				<ChevronLeft size={22} colorClassName="accent-foreground" />
			</Pressable>
			<Text className="ml-1 flex-1 font-geist-mono text-[10.5px] tracking-[0.14em] text-foreground/55">
				DETECCIÓN DE GASTOS
			</Text>
		</View>
	);
}

function PrimaryButton({
	label,
	onPress,
	disabled = false,
}: {
	label: string;
	onPress: () => void;
	disabled?: boolean;
}) {
	return (
		<Pressable
			accessibilityRole="button"
			accessibilityLabel={label}
			accessibilityState={{ disabled }}
			disabled={disabled}
			onPress={onPress}
			className={`items-center justify-center rounded-xl py-4 ${
				disabled ? "bg-line" : "bg-foreground active:opacity-80"
			}`}
		>
			<Text
				className={`font-hanken-semibold text-[15px] ${
					disabled ? "text-foreground/40" : "text-background"
				}`}
			>
				{label}
			</Text>
		</Pressable>
	);
}
