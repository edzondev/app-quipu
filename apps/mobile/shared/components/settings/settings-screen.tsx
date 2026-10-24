import { RNHostView } from "@expo/ui";
import { useForm } from "@tanstack/react-form";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Platform, Pressable, ScrollView, Text, View } from "react-native";
import { clearDeviceAfterAccountDeleted } from "@/lib/clear-device-after-delete";
import { signOutAndClearLocalData } from "@/lib/device-sign-out";
import { AuthLabeledField } from "@/shared/components/auth/auth-labeled-field";
import { ErrorText } from "@/shared/components/forms/field-error";
import { ListRow } from "@/shared/components/list-row";
import { SectionLabel } from "@/shared/components/section-label";
import { BottomSheet } from "@/shared/components/ui/bottom-sheet";
import { InlineLoading } from "@/shared/components/ui/inline-loading";
import { ArrowUpRight, X } from "@/shared/components/ui/reicon";
import { HIDDEN_UNTIL_READY } from "@/shared/hidden-until-ready";
import { SIGNED_OUT_HREF, signedOutHref } from "@/shared/lib/auth/device-session";
import { platformAdmitsPasskeys } from "@/shared/lib/auth/passkey-support";
import { HIT_SLOP } from "@/shared/lib/hit-slop";
import {
	DELETE_ACCOUNT_ERROR,
	DELETE_ACCOUNT_ERROR_POLAR_ACTIVE,
	DELETE_ACCOUNT_PASSWORD_LABEL,
	DELETE_ACCOUNT_PASSWORD_PLACEHOLDER,
	deleteAccountOnDevice,
	isPolarSubscriptionActiveCode,
} from "@/shared/lib/settings/delete-account";
import {
	LEGAL_PRIVACY_URL,
	LEGAL_TERMS_URL,
	openLegalUrl,
	PLAN_SETTINGS_URL,
} from "@/shared/lib/settings/legal";
import type { SettingsScreenModel } from "@/shared/lib/settings/model";

type Props = {
	status: "loading" | "empty" | "ready";
	model: SettingsScreenModel | null;
	onClose: () => void;
	onOpenSecurity: () => void;
	onOpenDetection?: () => void;
};

type Sheet = "signOut" | "deleteAccount" | null;

export function SettingsScreen({ status, model, onClose, onOpenSecurity, onOpenDetection }: Props) {
	const router = useRouter();
	const [sheet, setSheet] = useState<Sheet>(null);
	const [closing, setClosing] = useState(false);
	const [deleting, setDeleting] = useState(false);
	const [deleteError, setDeleteError] = useState<string | null>(null);
	const [polarBlocked, setPolarBlocked] = useState(false);
	const pending = useRef(false);
	const deleteForm = useForm({
		defaultValues: { password: "" },
		onSubmit: ({ value }) => {
			void confirmDeleteAccount(value.password);
		},
	});
	const hasPassword = model?.hasPassword === true;
	const deleteBlockedBySubscription = model?.deleteBlockedBySubscription;
	const showProfile = !HIDDEN_UNTIL_READY.profileAndData;
	const showPlan = !HIDDEN_UNTIL_READY.planAndSubscription;
	const showAllocation = !HIDDEN_UNTIL_READY.allocation;
	const showCycle = !HIDDEN_UNTIL_READY.cycleAndIncome;
	const showSystem = showAllocation || showCycle;

	async function confirmSignOut() {
		if (pending.current) return;
		pending.current = true;
		setClosing(true);
		let notified = true;
		try {
			const result = await signOutAndClearLocalData();
			notified = result.serverNotified;
		} finally {
			router.replace(signedOutHref(notified));
		}
	}

	async function confirmDeleteAccount(password: string) {
		if (pending.current) return;
		pending.current = true;
		setDeleting(true);
		setDeleteError(null);
		try {
			const result = await deleteAccountOnDevice({
				password,
				canUsePasskey: platformAdmitsPasskeys(Platform.OS, Platform.Version),
			});
			if (!result.ok) {
				if (isPolarSubscriptionActiveCode(result.code)) {
					setPolarBlocked(true);
					setDeleteError(null);
				} else {
					setPolarBlocked(false);
					setDeleteError(result.message || DELETE_ACCOUNT_ERROR);
				}
				pending.current = false;
				setDeleting(false);
				return;
			}
			await clearDeviceAfterAccountDeleted();
			router.replace({ pathname: SIGNED_OUT_HREF, params: { notice: "deleted" } });
		} catch {
			setDeleteError(DELETE_ACCOUNT_ERROR);
			pending.current = false;
			setDeleting(false);
		}
	}

	function dismissConfirm() {
		if (pending.current) return;
		setSheet(null);
		setDeleteError(null);
		setPolarBlocked(false);
	}

	useEffect(() => {
		if (sheet !== "deleteAccount" || !polarBlocked) return;
		if (deleteBlockedBySubscription !== false) return;
		setPolarBlocked(false);
		setDeleteError(null);
	}, [sheet, polarBlocked, deleteBlockedBySubscription]);

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
			{status === "loading" ? <InlineLoading /> : null}
			<ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
				{model ? (
					<>
						<View className="mt-[22px] flex-row items-center gap-3.5 border-b border-line pb-5">
							<View className="size-11 items-center justify-center rounded-full bg-line">
								<Text className="font-newsreader text-[19px] text-primary">{model.initial}</Text>
							</View>
							<View className="min-w-0 flex-1">
								<Text
									testID="settings-name"
									className="font-hanken-semibold text-[15px] text-foreground"
								>
									{model.name}
								</Text>
								{model.meta ? (
									<Text
										testID="settings-meta"
										className="mt-1.5 font-hanken text-[12.5px] text-foreground/45"
									>
										{model.meta}
									</Text>
								) : null}
							</View>
						</View>
						<View className="mt-5">
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
				{Platform.OS === "android" && onOpenDetection ? (
					<View className="mt-[18px] border-t border-line pt-4">
						<ListRow label="Detección de gastos" onPress={onOpenDetection} isLast />
					</View>
				) : null}
				<View className="mt-[18px] border-t border-line pt-4">
					<ListRow
						label="Política de privacidad"
						external
						onPress={() => {
							void openLegalUrl(LEGAL_PRIVACY_URL);
						}}
					/>
					<ListRow
						label="Términos y condiciones"
						external
						isLast
						onPress={() => {
							void openLegalUrl(LEGAL_TERMS_URL);
						}}
					/>
				</View>
				<View className="mt-[18px] border-t border-line pt-4">
					<Pressable
						accessibilityRole="button"
						accessibilityLabel="Cerrar sesión"
						hitSlop={HIT_SLOP}
						onPress={() => setSheet("signOut")}
						className="border-b border-line py-3.5 active:opacity-60"
					>
						<Text className="font-hanken text-[15px] text-danger">Cerrar sesión</Text>
					</Pressable>
					<Pressable
						accessibilityRole="button"
						accessibilityLabel="Eliminar cuenta"
						hitSlop={HIT_SLOP}
						onPress={() => {
							setDeleteError(null);
							setPolarBlocked(false);
							deleteForm.setFieldValue("password", "");
							setSheet("deleteAccount");
						}}
						className="py-3.5 active:opacity-60"
					>
						<Text className="font-hanken text-[15px] text-danger">Eliminar cuenta</Text>
					</Pressable>
				</View>
			</ScrollView>
			<BottomSheet
				isPresented={sheet !== null}
				onDismiss={dismissConfirm}
				contentPadding={0}
				containerColorClassName="accent-background"
			>
				<RNHostView>
					{sheet === "signOut" ? (
						<View className="bg-background px-5.5 pb-8 pt-3">
							<View className="border-l-2 border-danger pl-3.5">
								<Text className="font-newsreader text-[23px] leading-8 text-foreground">
									¿Cerrar sesión?
								</Text>
							</View>
							<Text className="mt-3.5 font-hanken text-[14.5px] leading-6 text-foreground/55">
								Se borra lo guardado en este teléfono.
							</Text>
							<Pressable
								testID="sign-out-confirm"
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
					) : sheet === "deleteAccount" ? (
						<View className="bg-background px-5.5 pb-8 pt-3">
							<View className="border-l-2 border-danger pl-3.5">
								<Text className="font-newsreader text-[23px] leading-8 text-foreground">
									¿Eliminar tu cuenta?
								</Text>
							</View>
							<Text className="mt-3.5 font-hanken text-[14.5px] leading-6 text-foreground/55">
								{polarBlocked
									? DELETE_ACCOUNT_ERROR_POLAR_ACTIVE
									: "Se borran para siempre tus movimientos, sobres, compromisos, ahorro y progreso. No se puede deshacer."}
							</Text>
							{hasPassword && !polarBlocked ? (
								<View className="mt-5">
									<deleteForm.Field name="password">
										{(field) => (
											<AuthLabeledField
												label={DELETE_ACCOUNT_PASSWORD_LABEL}
												field={field}
												secureTextEntry
												autoComplete="current-password"
												editable={!deleting}
												placeholder={DELETE_ACCOUNT_PASSWORD_PLACEHOLDER}
											/>
										)}
									</deleteForm.Field>
								</View>
							) : null}
							{polarBlocked ? (
								<Pressable
									accessibilityRole="button"
									accessibilityLabel="Ir a la web"
									onPress={() => {
										void openLegalUrl(PLAN_SETTINGS_URL);
									}}
									className="mt-[22px] flex-row items-center justify-center gap-2 rounded-xl bg-foreground py-4 active:opacity-80"
								>
									<Text className="font-hanken-semibold text-[15px] text-background">
										Ir a la web
									</Text>
									<ArrowUpRight size={18} strokeWidth={1.8} colorClassName="accent-background" />
								</Pressable>
							) : (
								<Pressable
									accessibilityRole="button"
									accessibilityLabel="Eliminar mi cuenta"
									accessibilityState={{ disabled: deleting }}
									disabled={deleting}
									onPress={() => {
										void deleteForm.handleSubmit();
									}}
									className="mt-[22px] items-center rounded-xl border border-danger py-4 active:opacity-80"
								>
									<Text className="font-hanken-semibold text-[15px] text-danger">
										{deleting ? "Eliminando…" : "Eliminar mi cuenta"}
									</Text>
								</Pressable>
							)}
							{deleteError ? <ErrorText message={deleteError} /> : null}
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
