import { RNHostView } from "@expo/ui";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { signOutAndClearLocalData } from "@/lib/device-sign-out";
import { ListRow } from "@/shared/components/list-row";
import { SectionLabel } from "@/shared/components/section-label";
import { BottomSheet } from "@/shared/components/ui/bottom-sheet";
import { X } from "@/shared/components/ui/reicon";
import { HIDDEN_UNTIL_READY } from "@/shared/hidden-until-ready";
import { noteOfflineSignOut, SIGNED_OUT_HREF } from "@/shared/lib/auth/device-session";
import { HIT_SLOP } from "@/shared/lib/hit-slop";
import type { SettingsScreenModel } from "@/shared/lib/settings/model";

type Props = {
	status: "loading" | "empty" | "ready";
	model: SettingsScreenModel | null;
	onClose: () => void;
	onOpenSecurity: () => void;
};

export function SettingsScreen({ status, model, onClose, onOpenSecurity }: Props) {
	const router = useRouter();
	const [confirming, setConfirming] = useState(false);
	const [closing, setClosing] = useState(false);
	const pending = useRef(false);
	const showProfile = !HIDDEN_UNTIL_READY.profileAndData;
	const showPlan = !HIDDEN_UNTIL_READY.planAndSubscription;
	const showAllocation = !HIDDEN_UNTIL_READY.allocation;
	const showCycle = !HIDDEN_UNTIL_READY.cycleAndIncome;
	const showSystem = showAllocation || showCycle;

	async function confirmSignOut() {
		if (pending.current) return;
		pending.current = true;
		setClosing(true);
		try {
			const result = await signOutAndClearLocalData();
			if (result?.serverNotified === false) noteOfflineSignOut();
		} finally {
			router.replace(SIGNED_OUT_HREF);
		}
	}

	function dismissConfirm() {
		if (pending.current) return;
		setConfirming(false);
	}

	return (
		<View className="flex-1">
			<View className="flex-row items-center justify-between">
				<Text className="font-newsreader text-[27px] leading-8 text-foreground">Ajustes</Text>
				<Pressable
					accessibilityRole="button"
					accessibilityLabel="Cerrar"
					hitSlop={HIT_SLOP}
					onPress={onClose}
					className="active:opacity-60"
				>
					<X size={22} colorClassName="accent-foreground" />
				</Pressable>
			</View>
			{status === "loading" ? (
				<Text className="mt-6 font-hanken text-[15px] text-foreground/55">Cargando…</Text>
			) : null}
			<ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
				{model ? (
					<>
						<View className="mt-[22px] flex-row items-center gap-3.5 border-b border-line pb-5">
							<View className="size-11 items-center justify-center rounded-full bg-line">
								<Text className="font-newsreader text-[19px] text-primary">{model.initial}</Text>
							</View>
							<View className="min-w-0 flex-1">
								<Text className="font-hanken-semibold text-[15px] text-foreground">
									{model.name}
								</Text>
								{model.meta ? (
									<Text className="mt-1.5 font-hanken text-[12.5px] text-foreground/45">
										{model.meta}
									</Text>
								) : null}
							</View>
						</View>
						<View className="mt-5">
							<SectionLabel className="mb-1">CUENTA</SectionLabel>
							{showProfile ? <ListRow label="Perfil y datos" /> : null}
							<ListRow
								label="Seguridad y Passkeys"
								value={model.passkeysLabel}
								onPress={onOpenSecurity}
								isLast={!showPlan}
							/>
							{showPlan ? (
								<ListRow label="Plan y suscripción" value={model.planLabel} isLast />
							) : null}
						</View>
						{showSystem ? (
							<View className="mt-[18px] border-t border-line pt-4">
								<SectionLabel className="mb-1">TU SISTEMA</SectionLabel>
								{showAllocation ? (
									<ListRow label="Reparto" value={model.repartoLabel} isLast={!showCycle} />
								) : null}
								{showCycle ? (
									<ListRow label="Ciclo e ingresos" value={model.scheduleCopy} isLast />
								) : null}
							</View>
						) : null}
					</>
				) : null}
				<Pressable
					accessibilityRole="button"
					accessibilityLabel="Cerrar sesión"
					hitSlop={HIT_SLOP}
					onPress={() => setConfirming(true)}
					className="mt-4 border-t border-line py-3.5 active:opacity-60"
				>
					<Text className="font-hanken text-[15px] text-danger">Cerrar sesión</Text>
				</Pressable>
			</ScrollView>
			<BottomSheet
				isPresented={confirming}
				onDismiss={dismissConfirm}
				contentPadding={0}
				containerColorClassName="accent-background"
			>
				<RNHostView>
					{confirming ? (
						<View className="bg-background px-5.5 pb-8 pt-3">
							<View className="border-l-2 border-danger pl-3.5">
								<Text className="font-geist-mono text-[10.5px] tracking-[0.14em] text-danger">
									CERRAR SESIÓN
								</Text>
								<Text className="mt-3 font-newsreader text-[23px] leading-8 text-foreground">
									Vas a salir de este teléfono.
								</Text>
							</View>
							<Text className="mt-3.5 font-hanken text-[14.5px] leading-6 text-foreground/55">
								Se cierra tu sesión y se borra lo que quedó guardado aquí.
							</Text>
							<Pressable
								accessibilityRole="button"
								accessibilityLabel="Confirmar cierre de sesión"
								accessibilityState={{ disabled: closing }}
								disabled={closing}
								onPress={() => {
									void confirmSignOut();
								}}
								className="mt-[22px] items-center rounded-xl bg-danger py-4 active:opacity-80"
							>
								<Text className="font-hanken-semibold text-[15px] text-background">
									{closing ? "Cerrando…" : "Cerrar sesión"}
								</Text>
							</Pressable>
							<Pressable
								accessibilityRole="button"
								accessibilityLabel="Cancelar"
								onPress={dismissConfirm}
								className="mt-2.5 items-center rounded-xl border border-line py-[15px] active:opacity-60"
							>
								<Text className="font-hanken-semibold text-[15px] text-foreground">Cancelar</Text>
							</Pressable>
						</View>
					) : (
						<View />
					)}
				</RNHostView>
			</BottomSheet>
		</View>
	);
}
