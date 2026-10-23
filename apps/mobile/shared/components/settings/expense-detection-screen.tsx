import { useEffect, useState } from "react";
import { AppState, Image, Pressable, ScrollView, Text, View } from "react-native";
import {
	addSource,
	getInstalledBanks,
	getSources,
	type InstalledBank,
	removeSource,
} from "@/modules/quipu-notification-listener";
import { ErrorText } from "@/shared/components/forms/field-error";
import { SectionLabel } from "@/shared/components/section-label";
import { InlineLoading } from "@/shared/components/ui/inline-loading";
import { Check, ChevronLeft } from "@/shared/components/ui/reicon";
import { useHardwareBack } from "@/shared/hooks/use-hardware-back";
import { HIT_SLOP } from "@/shared/lib/hit-slop";

const LIMIT = "Llegaste al límite de bancos. Quita uno para agregar otro.";
const OTHER_APP = "Otra app";

type Props = {
	onClose: () => void;
};

export function ExpenseDetectionScreen({ onClose }: Props) {
	const [banks, setBanks] = useState<InstalledBank[] | null>(null);
	const [sources, setSources] = useState<string[]>([]);
	const [atLimit, setAtLimit] = useState(false);

	useHardwareBack(onClose);

	useEffect(() => {
		let alive = true;
		const refresh = async () => {
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

	if (banks === null) {
		return (
			<View className="flex-1">
				<ScreenHeader onBack={onClose} />
				<InlineLoading />
			</View>
		);
	}

	const installed = banks.filter((bank) => bank.installed);
	const parked = banks.filter((bank) => !bank.installed && sources.includes(bank.packageId));
	const missing = banks.filter((bank) => !bank.installed && !sources.includes(bank.packageId));
	const known = new Set(banks.map((bank) => bank.packageId));
	const custom = sources.filter((id) => !known.has(id));
	const found = installed.length + custom.length;

	return (
		<View className="flex-1">
			<ScreenHeader onBack={onClose} />
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
								label={OTHER_APP}
								checked
								onPress={() => {
									void toggle(packageId);
								}}
							/>
						))}
					</View>
				) : null}
				{parked.length + missing.length > 0 ? (
					<View className="mt-5">
						<SectionLabel className="mb-1">OTROS</SectionLabel>
						{parked.map((bank) => (
							<BankChoice
								key={bank.packageId}
								label={bank.name}
								checked
								detail="NO INSTALADO"
								onPress={() => {
									void toggle(bank.packageId);
								}}
							/>
						))}
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
			{atLimit ? (
				<View className="pt-3">
					<ErrorText message={LIMIT} />
				</View>
			) : null}
		</View>
	);
}

function ScreenHeader({ onBack }: { onBack: () => void }) {
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
				DETECCIÓN DE GASTOS
			</Text>
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
