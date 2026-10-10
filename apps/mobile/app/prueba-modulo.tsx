import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
	AppState,
	Image,
	Platform,
	Pressable,
	ScrollView,
	Text,
	TextInput,
	View,
} from "react-native";
import {
	addSource,
	clearPendingNotifications,
	getInstalledBanks,
	getPendingNotifications,
	getSources,
	type InstalledBank,
	isNotificationAccessEnabled,
	openNotificationAccessSettings,
	removeSource,
} from "@/modules/quipu-notification-listener";
import AppShell from "@/shared/components/app-shell";
import { SectionLabel } from "@/shared/components/section-label";
import { ChevronLeft } from "@/shared/components/ui/reicon";
import { HIT_SLOP } from "@/shared/lib/hit-slop";
import { formatPostedAtLima, truncateProbeText } from "@/shared/lib/native-probe/format";

type SavedNote = {
	id: string;
	packageName: string;
	when: string;
	preview: string;
};

export default function PruebaModuloScreen() {
	const router = useRouter();
	return (
		<AppShell>
			<View className="flex-row items-center gap-3">
				<Pressable
					accessibilityRole="button"
					accessibilityLabel="Volver"
					hitSlop={HIT_SLOP}
					onPress={() => router.back()}
					className="active:opacity-60"
				>
					<ChevronLeft size={22} colorClassName="accent-foreground" />
				</Pressable>
				<Text className="font-newsreader text-[27px] leading-8 text-foreground">
					Prueba módulo nativo
				</Text>
			</View>
			{Platform.OS === "android" ? <AndroidProbe /> : <OtherPlatformNote />}
		</AppShell>
	);
}

function OtherPlatformNote() {
	return (
		<Text className="mt-6 font-hanken text-[15px] leading-6 text-foreground/55">
			Esta prueba solo está en Android.
		</Text>
	);
}

function AndroidProbe() {
	const [accessOn, setAccessOn] = useState(false);
	const [banks, setBanks] = useState<InstalledBank[] | null>(null);
	const [draft, setDraft] = useState("");
	const [addResult, setAddResult] = useState<string | null>(null);
	const [sources, setSources] = useState<string[]>([]);
	const [notes, setNotes] = useState<SavedNote[] | null>(null);

	const refreshAccess = useCallback(() => {
		setAccessOn(isNotificationAccessEnabled());
	}, []);

	const refreshSources = useCallback(async () => {
		setSources(await getSources());
	}, []);

	useEffect(() => {
		refreshAccess();
		void refreshSources();
		const subscription = AppState.addEventListener("change", (state) => {
			if (state === "active") refreshAccess();
		});
		return () => subscription.remove();
	}, [refreshAccess, refreshSources]);

	async function loadBanks() {
		setBanks(await getInstalledBanks());
	}

	async function submitSource() {
		const outcome = await addSource(draft);
		setAddResult(JSON.stringify(outcome));
		await refreshSources();
	}

	async function dropSource(packageName: string) {
		await removeSource(packageName);
		await refreshSources();
	}

	async function loadNotes() {
		const pending = await getPendingNotifications();
		setNotes(
			pending.map((item) => ({
				id: item.id,
				packageName: item.packageName,
				when: formatPostedAtLima(item.postedAt),
				preview: truncateProbeText(item.text),
			})),
		);
	}

	async function emptyNotes() {
		await clearPendingNotifications();
		setNotes([]);
	}

	return (
		<ScrollView className="mt-6 flex-1" showsVerticalScrollIndicator={false}>
			<SectionLabel>ACCESO</SectionLabel>
			<Text className="mt-2 font-hanken text-[15px] text-foreground">
				{accessOn ? "Acceso a notificaciones: activo" : "Acceso a notificaciones: inactivo"}
			</Text>
			<ActionButton label="Activar acceso" onPress={openNotificationAccessSettings} />

			<SectionLabel className="mt-8">BANCOS</SectionLabel>
			<ActionButton label="Ver bancos instalados" onPress={() => void loadBanks()} />
			{banks?.map((bank) => (
				<View key={bank.packageId} className="mt-3 flex-row gap-3 border-b border-line pb-3">
					{bank.icon ? (
						<Image
							accessibilityIgnoresInvertColors
							source={{ uri: `data:image/png;base64,${bank.icon}` }}
							style={{ width: 40, height: 40 }}
						/>
					) : (
						<View className="size-10 rounded-lg bg-line" />
					)}
					<View className="min-w-0 flex-1">
						<Text className="font-hanken-semibold text-[15px] text-foreground">{bank.name}</Text>
						<Text className="mt-1 font-geist-mono text-[12px] text-foreground/55">
							{bank.packageId}
						</Text>
						<Text className="mt-1 font-hanken text-[13px] text-foreground/70">
							{bank.installed ? "Instalado: sí" : "Instalado: no"}
							{bank.label ? ` · ${bank.label}` : ""}
						</Text>
					</View>
				</View>
			))}

			<SectionLabel className="mt-8">FUENTES</SectionLabel>
			<TextInput
				value={draft}
				onChangeText={setDraft}
				autoCapitalize="none"
				autoCorrect={false}
				placeholder="Link de Play o id del paquete"
				placeholderTextColor="#8C8880"
				accessibilityLabel="Link o id del paquete"
				className="mt-3 rounded-xl border border-line px-3 py-3 font-hanken text-[15px] text-foreground"
			/>
			<ActionButton label="Agregar" onPress={() => void submitSource()} />
			{addResult ? (
				<Text className="mt-2 font-geist-mono text-[12.5px] text-foreground">{addResult}</Text>
			) : null}
			{sources.map((packageName) => (
				<View
					key={packageName}
					className="mt-3 flex-row items-center justify-between border-b border-line pb-3"
				>
					<Text className="min-w-0 flex-1 pr-3 font-geist-mono text-[12.5px] text-foreground">
						{packageName}
					</Text>
					<Pressable
						accessibilityRole="button"
						accessibilityLabel={`Quitar ${packageName}`}
						hitSlop={HIT_SLOP}
						onPress={() => void dropSource(packageName)}
						className="active:opacity-60"
					>
						<Text className="font-hanken text-[14px] text-danger">Quitar</Text>
					</Pressable>
				</View>
			))}

			<SectionLabel className="mt-8">NOTIFICACIONES</SectionLabel>
			<ActionButton label="Ver notificaciones guardadas" onPress={() => void loadNotes()} />
			<ActionButton label="Vaciar" onPress={() => void emptyNotes()} />
			{notes?.map((note) => (
				<View key={note.id} className="mt-3 border-b border-line pb-3">
					<Text className="font-geist-mono text-[12px] text-foreground/55">{note.packageName}</Text>
					<Text className="mt-1 font-hanken text-[13px] text-foreground/70">{note.when}</Text>
					<Text className="mt-1 font-hanken text-[15px] text-foreground">{note.preview}</Text>
				</View>
			))}
		</ScrollView>
	);
}

function ActionButton({ label, onPress }: { label: string; onPress: () => void }) {
	return (
		<Pressable
			accessibilityRole="button"
			accessibilityLabel={label}
			hitSlop={HIT_SLOP}
			onPress={onPress}
			className="mt-3 items-center rounded-xl border border-line py-3.5 active:opacity-60"
		>
			<Text className="font-hanken-semibold text-[15px] text-foreground">{label}</Text>
		</Pressable>
	);
}
