import * as Linking from "expo-linking";
import { useEffect, useRef, useState } from "react";
import {
	AppState,
	Clipboard,
	Image,
	PermissionsAndroid,
	Platform,
	Pressable,
	ScrollView,
	Text,
	TextInput,
	View,
} from "react-native";
import {
	type AddSourceResult,
	addSource,
	getInstalledBanks,
	getSources,
	type InstalledBank,
	isNotificationAccessEnabled,
	openNotificationAccessSettings,
	type PlayStoreLinkResult,
	parsePlayStoreLink,
	removeSource,
} from "@/modules/quipu-notification-listener";
import { ErrorText } from "@/shared/components/forms/field-error";
import { SectionLabel } from "@/shared/components/section-label";
import { InlineLoading } from "@/shared/components/ui/inline-loading";
import { Check, ChevronLeft } from "@/shared/components/ui/reicon";
import { useHardwareBack } from "@/shared/hooks/use-hardware-back";
import { HIT_SLOP } from "@/shared/lib/hit-slop";

const INVALID_LINK = "Ese enlace no es de la Play Store. Debe empezar con play.google.com.";
const NOT_INSTALLED =
	"Esa app no está en tu teléfono. Instálala primero para que Quipu pueda leer sus avisos.";
const UNAVAILABLE = "No pudimos leer ese enlace. Inténtalo de nuevo.";
const LIMIT = "Llegaste al límite de bancos. Quita uno para agregar otro.";
const NOT_A_BANK = "Esa app no parece un banco. ¿Seguro que te avisa de tus gastos?";
const READS =
	"Solo el monto y el comercio de los avisos de tus bancos. Nunca tus claves, ni tus saldos, ni el resto de tus notificaciones.";

const LINK_STEPS = [
	"Toca «Abrir Play Store» y busca la app de tu banco.",
	"En la página de la app toca los tres puntos ⋮ y luego Compartir → Copiar enlace.",
	"Vuelve aquí y toca Pegar.",
] as const;

const ACCESS_STEPS = [
	"Toca «Intentar de nuevo»",
	"En la lista, busca Quipu",
	"Activa el interruptor y vuelve",
] as const;

type Step = "banks" | "link" | "access";

type Props = {
	onClose: () => void;
};

export function ExpenseDetectionScreen({ onClose }: Props) {
	const [step, setStep] = useState<Step>("banks");
	const [banks, setBanks] = useState<InstalledBank[] | null>(null);
	const [sources, setSources] = useState<string[]>([]);
	const [accessOn, setAccessOn] = useState(false);
	const [returnedWithoutAccess, setReturnedWithoutAccess] = useState(false);
	const [linkText, setLinkText] = useState("");
	const [parsed, setParsed] = useState<PlayStoreLinkResult | null>(null);
	const [addResult, setAddResult] = useState<AddSourceResult | null>(null);
	const [saving, setSaving] = useState(false);
	const [atLimit, setAtLimit] = useState(false);
	const awaitingReturn = useRef(false);
	const onCloseRef = useRef(onClose);
	onCloseRef.current = onClose;

	function goBack() {
		if (step === "banks") onClose();
		else setStep("banks");
	}

	useHardwareBack(goBack);

	useEffect(() => {
		let alive = true;
		// Settings and the Play Store both leave the app. Read access and installed apps on return.
		const refresh = async () => {
			const enabled = isNotificationAccessEnabled();
			if (!alive) return;
			setAccessOn(enabled);
			if (awaitingReturn.current) {
				awaitingReturn.current = false;
				if (!enabled) setReturnedWithoutAccess(true);
			}
			try {
				const [nextBanks, nextSources] = await Promise.all([getInstalledBanks(), getSources()]);
				if (!alive) return;
				setBanks(nextBanks);
				setSources(nextSources);
			} catch {
				if (!alive) return;
				setBanks((current) => current ?? []);
			}
		};
		void refresh();
		const subscription = AppState.addEventListener("change", (state) => {
			if (state === "active") void refresh();
		});
		return () => {
			alive = false;
			subscription.remove();
		};
	}, []);

	useEffect(() => {
		if (step !== "access" || !accessOn) return;
		// The route passes a new onClose each render. Restarting this timer would skip the close.
		const timer = setTimeout(() => onCloseRef.current(), 600);
		return () => clearTimeout(timer);
	}, [step, accessOn]);

	useEffect(() => {
		if (step !== "access") return;
		if (Platform.OS !== "android" || Number(Platform.Version) < 33) return;
		void PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
	}, [step]);

	async function toggle(packageId: string) {
		if (sources.includes(packageId)) {
			const removed = await removeSource(packageId);
			if (!removed) return;
			setAtLimit(false);
			setSources((current) => current.filter((id) => id !== packageId));
			return;
		}
		const result = await addSource(packageId);
		if (result === "limit_reached") {
			setAtLimit(true);
			return;
		}
		if (result === "added" || result === "added_unverified" || result === "already_added") {
			setAtLimit(false);
			setSources((current) => (current.includes(packageId) ? current : [...current, packageId]));
		}
	}

	function applyLink(text: string) {
		setLinkText(text);
		setAddResult(null);
		const trimmed = text.trim();
		setParsed(trimmed.length > 0 ? parsePlayStoreLink(trimmed) : null);
	}

	async function paste() {
		applyLink(await Clipboard.getString());
	}

	function clearLink() {
		setLinkText("");
		setParsed(null);
		setAddResult(null);
	}

	async function confirmLink() {
		if (saving) return;
		const input = linkText.trim();
		if (!input) return;
		setSaving(true);
		try {
			const result = await addSource(input);
			if (result === "added" || result === "added_unverified") {
				setSources(await getSources());
				setLinkText("");
				setParsed(null);
				setAddResult(null);
				setStep("banks");
				return;
			}
			setAddResult(result);
		} finally {
			setSaving(false);
		}
	}

	function openAccessSettings() {
		awaitingReturn.current = true;
		openNotificationAccessSettings();
	}

	function openPlayStore(packageId?: string) {
		const url = packageId
			? `https://play.google.com/store/apps/details?id=${encodeURIComponent(packageId)}`
			: "https://play.google.com/store/apps";
		void Linking.openURL(url).catch(() => undefined);
	}

	if (banks === null) {
		return (
			<View className="flex-1">
				<ScreenHeader title="DETECCIÓN DE GASTOS" onBack={goBack} />
				<InlineLoading />
			</View>
		);
	}

	if (step === "link") {
		return (
			<LinkStep
				banks={banks}
				sources={sources}
				linkText={linkText}
				parsed={parsed}
				addResult={addResult}
				saving={saving}
				onBack={goBack}
				onChangeLink={applyLink}
				onPaste={() => {
					void paste();
				}}
				onClear={clearLink}
				onConfirm={() => {
					void confirmLink();
				}}
				onOpenStore={openPlayStore}
			/>
		);
	}

	if (step === "access") {
		const names = [
			...banks
				.filter((bank) => bank.installed && sources.includes(bank.packageId))
				.map((bank) => bank.name),
			...sources.filter((id) => !banks.some((bank) => bank.packageId === id)),
		];
		const saved =
			names.length <= 1
				? `Guardamos ${names[0] ?? ""}. Queda en pausa hasta que lo actives.`
				: `Guardamos ${names.slice(0, -1).join(", ")} y ${names[names.length - 1]}. Queda en pausa hasta que lo actives.`;
		return (
			<AccessStep
				accessOn={accessOn}
				denied={returnedWithoutAccess && !accessOn}
				saved={saved}
				onBack={goBack}
				onOpenSettings={openAccessSettings}
				onClose={onClose}
			/>
		);
	}

	const installed = banks.filter((bank) => bank.installed);
	const missing = banks.filter((bank) => !bank.installed);
	const known = new Set(banks.map((bank) => bank.packageId));
	const custom = sources.filter((id) => !known.has(id));
	const found = installed.length + custom.length;
	const continueLabel = sources.length > 0 ? `Continuar (${sources.length})` : "Continuar";

	return (
		<View className="flex-1">
			<ScreenHeader title="DETECCIÓN DE GASTOS" step="1 DE 2" onBack={goBack} />
			<ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
				<Text className="mt-6 font-newsreader text-[27px] leading-8 text-foreground">
					¿Qué apps usas para pagar?
				</Text>
				<Text className="mt-2 font-hanken text-[14.5px] leading-6 text-foreground/55">
					Marca tu banco y tus billeteras. Quipu solo leerá los avisos de esas apps.
				</Text>
				{found > 0 ? (
					<View className="mt-6">
						<View className="mb-1 flex-row items-center justify-between">
							<SectionLabel>EN TU TELÉFONO</SectionLabel>
							<Text className="font-geist-mono text-[10.5px] tracking-[0.14em] text-foreground/45">
								{found === 1 ? "1 ENCONTRADA" : `${found} ENCONTRADAS`}
							</Text>
						</View>
						{installed.map((bank) => (
							<BankChoice
								key={bank.packageId}
								label={bank.name}
								icon={bank.icon}
								checked={sources.includes(bank.packageId)}
								onPress={() => {
									void toggle(bank.packageId);
								}}
							/>
						))}
						{custom.map((packageId) => (
							<BankChoice
								key={packageId}
								label={packageId}
								checked
								onPress={() => {
									void toggle(packageId);
								}}
							/>
						))}
					</View>
				) : null}
				{missing.length > 0 ? (
					<View className="mt-5">
						<SectionLabel className="mb-1">OTROS</SectionLabel>
						{missing.map((bank) => (
							<BankChoice
								key={bank.packageId}
								label={bank.name}
								checked={false}
								disabled
								detail="NO INSTALADO"
							/>
						))}
					</View>
				) : null}
			</ScrollView>
			<View className="gap-3 pt-3">
				{atLimit ? <ErrorText message={LIMIT} /> : null}
				<SolidButton
					label={continueLabel}
					disabled={sources.length === 0}
					onPress={() => setStep("access")}
				/>
				<Pressable
					accessibilityRole="button"
					accessibilityLabel="¿No ves tu banco? Agrégalo con su enlace"
					onPress={() => setStep("link")}
					className="items-center py-1 active:opacity-60"
				>
					<Text className="text-center font-hanken-semibold text-[13.5px] text-primary">
						¿No ves tu banco? Agrégalo con su enlace
					</Text>
				</Pressable>
			</View>
		</View>
	);
}

function LinkStep({
	banks,
	sources,
	linkText,
	parsed,
	addResult,
	saving,
	onBack,
	onChangeLink,
	onPaste,
	onClear,
	onConfirm,
	onOpenStore,
}: {
	banks: InstalledBank[];
	sources: string[];
	linkText: string;
	parsed: PlayStoreLinkResult | null;
	addResult: AddSourceResult | null;
	saving: boolean;
	onBack: () => void;
	onChangeLink: (text: string) => void;
	onPaste: () => void;
	onClear: () => void;
	onConfirm: () => void;
	onOpenStore: (packageId?: string) => void;
}) {
	const packageId = parsed && "packageId" in parsed ? parsed.packageId : null;
	const matched = packageId ? banks.find((bank) => bank.packageId === packageId) : undefined;
	const notInstalled = matched ? !matched.installed : addResult === "not_installed";
	const linkError = parsed && "error" in parsed ? parsed.error : null;
	const invalid = linkError === "invalid_link" || addResult === "invalid_link";
	const unavailable = linkError === "unavailable";
	const limited = addResult === "limit_reached";
	const already =
		!limited &&
		!invalid &&
		!notInstalled &&
		!unavailable &&
		packageId !== null &&
		(sources.includes(packageId) || addResult === "already_added");
	const confirmInstalled = Boolean(
		matched?.installed && packageId && !already && !limited && !invalid && !unavailable,
	);
	const confirmUnknown = Boolean(
		packageId &&
			!matched &&
			!already &&
			!notInstalled &&
			!limited &&
			!invalid &&
			!unavailable &&
			addResult !== "not_installed",
	);
	const line =
		invalid || unavailable || notInstalled || limited
			? "border-danger"
			: packageId
				? "border-primary"
				: "border-line";
	const showGuide = !confirmInstalled && !confirmUnknown;

	return (
		<View className="flex-1">
			<ScreenHeader title="AGREGAR CON ENLACE" onBack={onBack} />
			<ScrollView
				className="flex-1"
				keyboardShouldPersistTaps="handled"
				showsVerticalScrollIndicator={false}
			>
				<Text className="mt-6 font-newsreader text-[27px] leading-8 text-foreground">
					Agrega tu banco con su enlace.
				</Text>
				{showGuide ? (
					<Text className="mt-2 font-hanken text-[14.5px] leading-6 text-foreground/55">
						Para apps que no están en la lista. Toma un minuto.
					</Text>
				) : null}
				{showGuide
					? LINK_STEPS.map((stepText, index) => (
							<View key={stepText} className="mt-4">
								<Text className="font-geist-mono text-[10.5px] tracking-[0.14em] text-foreground/45">
									{String(index + 1).padStart(2, "0")}
								</Text>
								<Text className="mt-1 font-hanken text-[14.5px] leading-6 text-foreground">
									{stepText}
								</Text>
								{index === 0 ? (
									<Pressable
										accessibilityRole="button"
										accessibilityLabel="Abrir Play Store"
										onPress={() => onOpenStore()}
										className="mt-3 items-center rounded-xl border border-line py-3.5 active:opacity-60"
									>
										<Text className="font-hanken-semibold text-[15px] text-foreground">
											Abrir Play Store
										</Text>
									</Pressable>
								) : null}
							</View>
						))
					: null}
				<View className="mt-6">
					<Text className="font-geist-mono text-[10.5px] tracking-[0.14em] text-foreground/55">
						ENLACE DE LA APP
					</Text>
					<View className={`mt-1 flex-row items-center gap-3 border-b ${line}`}>
						<TextInput
							value={linkText}
							onChangeText={onChangeLink}
							accessibilityLabel="ENLACE DE LA APP"
							autoCapitalize="none"
							autoCorrect={false}
							placeholder="Pega aquí el enlace"
							className="min-w-0 flex-1 py-2.5 font-hanken text-[15px] text-foreground"
						/>
						<Pressable
							accessibilityRole="button"
							accessibilityLabel="Pegar"
							hitSlop={HIT_SLOP}
							onPress={onPaste}
							className="py-2 active:opacity-60"
						>
							<Text className="font-hanken-semibold text-[15px] text-primary">Pegar</Text>
						</Pressable>
					</View>
					{limited ? <ErrorText message={LIMIT} /> : null}
					{invalid ? <ErrorText message={INVALID_LINK} /> : null}
					{unavailable && !invalid ? <ErrorText message={UNAVAILABLE} /> : null}
					{notInstalled && !invalid ? <ErrorText message={NOT_INSTALLED} /> : null}
					{notInstalled && packageId ? (
						<Pressable
							accessibilityRole="button"
							accessibilityLabel="Abrir en Play Store"
							onPress={() => onOpenStore(packageId)}
							className="mt-2 self-start active:opacity-60"
						>
							<Text className="font-hanken-semibold text-[14px] text-primary">
								Abrir en Play Store
							</Text>
						</Pressable>
					) : null}
					{already ? (
						<Text className="mt-2 font-hanken text-[13.5px] text-foreground/70">
							{`${matched?.name ?? "Esa app"} ya está en tu lista.`}
						</Text>
					) : null}
				</View>
				{confirmInstalled && matched ? (
					<View className="mt-6">
						<Text className="font-geist-mono text-[10.5px] tracking-[0.14em] text-primary">
							APP ENCONTRADA
						</Text>
						<View className="mt-3 flex-row items-center gap-3">
							{matched.icon ? (
								<Image
									accessible={false}
									source={{ uri: `data:image/png;base64,${matched.icon}` }}
									className="size-9 rounded-lg"
								/>
							) : null}
							<View className="min-w-0 flex-1">
								<Text className="font-hanken-semibold text-[16px] text-foreground">
									{matched.name}
								</Text>
								<Text className="mt-1 font-geist-mono text-[10.5px] tracking-[0.08em] text-foreground/45">
									INSTALADA EN TU TELÉFONO
								</Text>
							</View>
						</View>
						<Text className="mt-3 font-hanken text-[15px] text-foreground">
							¿Es la app de tu banco?
						</Text>
					</View>
				) : null}
				{confirmUnknown && packageId ? (
					<View className="mt-6">
						<Text className="font-hanken-semibold text-[16px] text-foreground">{packageId}</Text>
						<Text className="mt-2 font-hanken text-[14.5px] leading-6 text-foreground/70">
							{NOT_A_BANK}
						</Text>
					</View>
				) : null}
			</ScrollView>
			<View className="gap-2 pt-3">
				{confirmInstalled || confirmUnknown ? (
					<>
						<SolidButton label="Sí, agregar" disabled={saving} onPress={onConfirm} />
						<Pressable
							accessibilityRole="button"
							accessibilityLabel="No"
							onPress={onClear}
							className="items-center py-2 active:opacity-60"
						>
							<Text className="font-hanken text-[13.5px] text-foreground/55">No</Text>
						</Pressable>
					</>
				) : (
					<SolidButton label="Agregar" disabled onPress={() => undefined} />
				)}
			</View>
		</View>
	);
}

function AccessStep({
	accessOn,
	denied,
	saved,
	onBack,
	onOpenSettings,
	onClose,
}: {
	accessOn: boolean;
	denied: boolean;
	saved: string;
	onBack: () => void;
	onOpenSettings: () => void;
	onClose: () => void;
}) {
	return (
		<View className="flex-1">
			<ScreenHeader title="DETECCIÓN DE GASTOS" step="2 DE 2" onBack={onBack} />
			<ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
				{denied ? (
					<View className="mt-6 border-l-2 border-warning pl-3.5">
						<Text className="font-geist-mono text-[10.5px] tracking-[0.14em] text-warning-foreground">
							AÚN NO ESTÁ ACTIVADO
						</Text>
						<Text className="mt-3 font-newsreader text-[27px] leading-8 text-foreground">
							Quipu no puede leer los avisos de tu banco.
						</Text>
						<Text className="mt-2 font-hanken text-[14.5px] leading-6 text-foreground/55">
							Sin este permiso Quipu no puede ver los avisos del banco. Todo lo demás sigue
							funcionando: registras tus gastos a mano.
						</Text>
						<Text className="mt-5 font-geist-mono text-[10.5px] tracking-[0.14em] text-foreground/45">
							PARA ACTIVARLO
						</Text>
						{ACCESS_STEPS.map((stepText, index) => (
							<Text
								key={stepText}
								className="mt-3 font-hanken text-[14.5px] leading-6 text-foreground"
							>
								{`${String(index + 1).padStart(2, "0")}  ${stepText}`}
							</Text>
						))}
						<Text className="mt-5 font-geist-mono text-[10.5px] tracking-[0.14em] text-foreground/45">
							QUÉ LEE QUIPU
						</Text>
						<Text className="mt-2 font-hanken text-[14.5px] leading-6 text-foreground/55">
							{READS}
						</Text>
					</View>
				) : (
					<View className="mt-6">
						<Text className="font-geist-mono text-[10.5px] tracking-[0.14em] text-foreground/45">
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
							Android muestra un mensaje de advertencia general. Es normal: Quipu solo lee los
							bancos que elegiste.
						</Text>
					</View>
				)}
			</ScrollView>
			<View className="gap-2 pt-3">
				{accessOn ? (
					<View className="flex-row items-center justify-center gap-2 rounded-xl bg-primary py-4">
						<Check size={18} colorClassName="accent-background" />
						<Text className="font-hanken-semibold text-[15px] text-background">
							Permiso activado
						</Text>
					</View>
				) : (
					<>
						<SolidButton
							label={denied ? "Intentar de nuevo" : "Ir a Ajustes de Android"}
							onPress={onOpenSettings}
						/>
						<Pressable
							accessibilityRole="button"
							accessibilityLabel="Ahora no"
							onPress={onClose}
							className="items-center py-2 active:opacity-60"
						>
							<Text className="font-hanken text-[13.5px] text-foreground/55">Ahora no</Text>
						</Pressable>
						{denied ? (
							<Text className="text-center font-hanken text-[12.5px] leading-5 text-foreground/40">
								{saved}
							</Text>
						) : null}
					</>
				)}
			</View>
		</View>
	);
}

function ScreenHeader({
	title,
	step,
	onBack,
}: {
	title: string;
	step?: string;
	onBack: () => void;
}) {
	return (
		<View className="flex-row items-center">
			<Pressable
				accessibilityRole="button"
				accessibilityLabel="Volver"
				hitSlop={HIT_SLOP}
				onPress={onBack}
				className="active:opacity-60"
			>
				<ChevronLeft size={22} colorClassName="accent-foreground" />
			</Pressable>
			<Text className="ml-3 flex-1 font-geist-mono text-[10.5px] tracking-[0.14em] text-foreground/55">
				{title}
			</Text>
			{step ? (
				<Text className="font-geist-mono text-[10.5px] tracking-[0.14em] text-foreground/45">
					{step}
				</Text>
			) : null}
		</View>
	);
}

function BankChoice({
	label,
	checked,
	disabled = false,
	icon,
	detail,
	onPress,
}: {
	label: string;
	checked: boolean;
	disabled?: boolean;
	icon?: string;
	detail?: string;
	onPress?: () => void;
}) {
	return (
		<Pressable
			accessibilityRole="checkbox"
			accessibilityLabel={label}
			accessibilityState={{ checked, disabled }}
			disabled={disabled || !onPress}
			onPress={onPress}
			className={`flex-row items-center gap-3 border-b border-foreground/10 py-3.5 ${
				disabled ? "opacity-40" : "active:opacity-60"
			}`}
		>
			{icon ? (
				<Image
					accessible={false}
					source={{ uri: `data:image/png;base64,${icon}` }}
					className="size-9 rounded-lg"
				/>
			) : null}
			<View className="min-w-0 flex-1">
				<Text className="font-hanken text-[15px] text-foreground">{label}</Text>
				{detail ? (
					<Text className="mt-1 font-geist-mono text-[10.5px] tracking-[0.08em] text-foreground/45">
						{detail}
					</Text>
				) : null}
			</View>
			<View
				className={`size-5 items-center justify-center rounded-md border ${
					checked ? "border-primary bg-primary" : "border-foreground/25"
				}`}
			>
				{checked ? <Check size={14} colorClassName="accent-background" /> : null}
			</View>
		</Pressable>
	);
}

function SolidButton({
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
			className={`items-center rounded-xl py-4 ${disabled ? "bg-line" : "bg-foreground active:opacity-80"}`}
		>
			<Text
				className={`font-hanken-semibold text-[15px] ${disabled ? "text-foreground/40" : "text-background"}`}
			>
				{label}
			</Text>
		</Pressable>
	);
}
