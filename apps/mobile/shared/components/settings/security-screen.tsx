import { RNHostView } from "@expo/ui";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { ErrorText } from "@/shared/components/forms/field-error";
import { ListRow } from "@/shared/components/list-row";
import { SectionLabel } from "@/shared/components/section-label";
import { BottomSheet } from "@/shared/components/ui/bottom-sheet";
import { ChevronLeft } from "@/shared/components/ui/reicon";
import { readActionError } from "@/shared/lib/expenses/errors";
import { HIT_SLOP } from "@/shared/lib/hit-slop";
import {
	SECURITY_ERROR,
	type SecurityPasskeyRow,
	type SecurityScreenModel,
	type SecuritySessionRow,
} from "@/shared/lib/settings/security-model";

const INTRO = "Cada dispositivo tiene su propia llave. Puedes quitar la que ya no uses.";
const UNAVAILABLE = "No disponible";

const SHEET = {
	passkey: {
		eyebrow: "ELIMINAR PASSKEY",
		title: (name: string) => `Vas a quitar la llave de ${name}.`,
		body: "Ese dispositivo dejará de entrar con esta Passkey. Podrás volver a crearla cuando quieras.",
		confirm: "Eliminar Passkey",
		error: SECURITY_ERROR.remove,
	},
	all: {
		eyebrow: "CERRAR SESIONES",
		title: (_name: string) => "Vas a cerrar todas las sesiones.",
		body: "Se cerrará la sesión en todos los dispositivos, incluido este.",
		confirm: "Cerrar todas",
		error: SECURITY_ERROR.revokeAll,
	},
} as const;

type Props = {
	status: "loading" | "empty" | "ready";
	model: SecurityScreenModel | null;
	onBack: () => void;
	onAddPasskey: () => Promise<unknown>;
	onDeletePasskey: (id: string) => Promise<unknown>;
	onRevokeSession: (sessionId: string) => Promise<unknown>;
	onRevokeAll: () => Promise<unknown>;
};

type Confirm = { kind: "passkey"; passkey: SecurityPasskeyRow } | { kind: "all" };

export function SecurityScreen({
	status,
	model,
	onBack,
	onAddPasskey,
	onDeletePasskey,
	onRevokeSession,
	onRevokeAll,
}: Props) {
	const [confirm, setConfirm] = useState<Confirm | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [pending, setPending] = useState(false);

	function dismissConfirm() {
		setError(null);
		setConfirm(null);
	}

	async function run(action: () => Promise<unknown>, fallback: string) {
		setPending(true);
		setError(null);
		try {
			await action();
			setConfirm(null);
		} catch (caught) {
			setError(readActionError(caught, fallback));
		} finally {
			setPending(false);
		}
	}

	return (
		<View className="flex-1">
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
				<Text className="flex-1 text-center font-geist-mono text-[10.5px] tracking-[0.14em] text-foreground/55">
					SEGURIDAD
				</Text>
				<View className="w-[22px]" />
			</View>

			{status === "loading" ? (
				<Text className="mt-6 font-hanken text-[15px] text-foreground/55">Cargando…</Text>
			) : null}
			{status === "empty" ? (
				<Text className="mt-6 font-hanken text-[15px] text-foreground/55">
					Inicia sesión para ver tu seguridad.
				</Text>
			) : null}

			{model ? (
				<ScrollView
					className="flex-1"
					contentContainerClassName="grow pb-4"
					showsVerticalScrollIndicator={false}
				>
					<View className="mt-[26px]">
						<Text className="font-newsreader text-[27px] leading-8 text-foreground">Passkeys</Text>
						<Text className="mt-2 font-hanken text-[14px] leading-[21px] text-foreground/55">
							{INTRO}
						</Text>
					</View>
					<PasskeySection
						passkeys={model.passkeys}
						pending={pending}
						onOpen={(passkey) => {
							setError(null);
							setConfirm({ kind: "passkey", passkey });
						}}
						onAdd={() => void run(onAddPasskey, SECURITY_ERROR.add)}
					/>
					{error && confirm == null ? <ErrorText message={error} /> : null}
					<View className="mt-4 border-t border-line pt-4">
						<SectionLabel className="mb-1">RESPALDO</SectionLabel>
						<ListRow label="Contraseña" value={model.passwordLabel} />
						<ListRow
							label="Correo de recuperación"
							value={model.emailLabel}
							valueClass={model.emailVerified ? "text-primary" : "text-foreground/45"}
							isLast
						/>
					</View>
					<SessionSection
						sessions={model.sessions}
						pending={pending}
						onClose={(sessionId) =>
							void run(() => onRevokeSession(sessionId), SECURITY_ERROR.revoke)
						}
						onCloseAll={() => {
							setError(null);
							setConfirm({ kind: "all" });
						}}
					/>
				</ScrollView>
			) : null}

			<BottomSheet
				isPresented={confirm != null}
				onDismiss={dismissConfirm}
				contentPadding={0}
				containerColorClassName="accent-background"
			>
				<RNHostView matchContents>
					{confirm ? (
						<ConfirmSheet
							confirm={confirm}
							passkeyCount={model?.passkeys?.length ?? 0}
							error={error}
							pending={pending}
							onDismiss={dismissConfirm}
							onConfirm={() => {
								const copy = SHEET[confirm.kind];
								if (confirm.kind === "passkey") {
									void run(() => onDeletePasskey(confirm.passkey.id), copy.error);
									return;
								}
								void run(onRevokeAll, copy.error).catch(() => {});
							}}
						/>
					) : (
						<View />
					)}
				</RNHostView>
			</BottomSheet>
		</View>
	);
}

function PasskeySection({
	passkeys,
	pending,
	onOpen,
	onAdd,
}: {
	passkeys: SecurityPasskeyRow[] | null;
	pending: boolean;
	onOpen: (passkey: SecurityPasskeyRow) => void;
	onAdd: () => void;
}) {
	if (!passkeys) {
		return <Text className="mt-4 font-hanken text-[15px] text-foreground/55">{UNAVAILABLE}</Text>;
	}
	return (
		<View className="mt-[22px] border-t border-line">
			{passkeys.length === 0 ? (
				<Text className="py-4 font-hanken text-[15px] text-foreground/55">
					Todavía no hay Passkeys.
				</Text>
			) : (
				passkeys.map((passkey, index) => (
					<ListRow
						key={passkey.id}
						label={passkey.name}
						subtitle={passkey.createdLabel}
						onPress={() => onOpen(passkey)}
						isLast={index === passkeys.length - 1}
					/>
				))
			)}
			<Pressable
				accessibilityRole="button"
				accessibilityLabel="Agregar una Passkey"
				accessibilityState={{ disabled: pending }}
				disabled={pending}
				hitSlop={HIT_SLOP}
				onPress={onAdd}
				className="flex-row items-center gap-2.5 py-4 active:opacity-60"
			>
				<Text className="font-hanken-semibold text-[15px] text-primary">Agregar una Passkey</Text>
			</Pressable>
		</View>
	);
}

function SessionSection({
	sessions,
	pending,
	onClose,
	onCloseAll,
}: {
	sessions: SecuritySessionRow[] | null;
	pending: boolean;
	onClose: (sessionId: string) => void;
	onCloseAll: () => void;
}) {
	if (!sessions) {
		return (
			<View className="mt-4 border-t border-line pt-4">
				<SectionLabel>SESIONES ACTIVAS</SectionLabel>
				<Text className="mt-3 font-hanken text-[15px] text-foreground/55">{UNAVAILABLE}</Text>
			</View>
		);
	}
	return (
		<View className="mt-4 border-t border-line pt-4">
			<View className="mb-1 flex-row items-baseline justify-between">
				<SectionLabel>SESIONES ACTIVAS</SectionLabel>
				<Text className="font-geist-mono text-[11.5px] text-foreground/45">{sessions.length}</Text>
			</View>
			{sessions.length === 0 ? (
				<Text className="py-3.5 font-hanken text-[15px] text-foreground/55">
					No hay sesiones activas.
				</Text>
			) : (
				sessions.map((session, index) => (
					<ListRow
						key={session.id}
						label={session.device}
						subtitle={session.activity}
						subtitleClass={session.isCurrent ? "text-primary" : "text-foreground/45"}
						isLast={index === sessions.length - 1}
						trailing={
							session.isCurrent ? null : (
								<Pressable
									accessibilityRole="button"
									accessibilityLabel={`Cerrar sesión de ${session.device}`}
									accessibilityState={{ disabled: pending }}
									disabled={pending}
									hitSlop={HIT_SLOP}
									onPress={() => onClose(session.id)}
									className="active:opacity-60"
								>
									<Text className="font-hanken-semibold text-[13.5px] text-danger">Cerrar</Text>
								</Pressable>
							)
						}
					/>
				))
			)}
			<Pressable
				accessibilityRole="button"
				accessibilityLabel="Cerrar todas las sesiones"
				accessibilityState={{ disabled: pending }}
				disabled={pending}
				hitSlop={HIT_SLOP}
				onPress={onCloseAll}
				className="mb-2 mt-auto items-center py-4 active:opacity-60"
			>
				<Text className="font-hanken-semibold text-[14px] text-danger">
					Cerrar todas las sesiones
				</Text>
			</Pressable>
		</View>
	);
}

function deleteWarning(remaining: number): string | null {
	if (remaining > 1) return null;
	if (remaining === 1) {
		return "Te quedará 1 Passkey. Si la pierdes, entrarás con tu contraseña de respaldo.";
	}
	return "Esta es tu última Passkey. Si la borras, entrarás con tu contraseña de respaldo.";
}

function ConfirmSheet({
	confirm,
	passkeyCount,
	error,
	pending,
	onDismiss,
	onConfirm,
}: {
	confirm: Confirm;
	passkeyCount: number;
	error: string | null;
	pending: boolean;
	onDismiss: () => void;
	onConfirm: () => void;
}) {
	const copy = SHEET[confirm.kind];
	const passkey = confirm.kind === "passkey" ? confirm.passkey : null;
	const warning = passkey ? deleteWarning(Math.max(0, passkeyCount - 1)) : null;
	return (
		<View className="bg-background px-5.5 pb-8 pt-3">
			<View className="border-l-2 border-danger pl-3.5">
				<Text className="font-geist-mono text-[10.5px] tracking-[0.14em] text-danger">
					{copy.eyebrow}
				</Text>
				<Text className="mt-3 font-newsreader text-[23px] leading-8 text-foreground">
					{copy.title(passkey?.name ?? "")}
				</Text>
			</View>
			<Text className="mt-3.5 font-hanken text-[14.5px] leading-6 text-foreground/55">
				{copy.body}
			</Text>
			{passkey ? (
				<View className="mt-5 rounded-xl bg-line px-[18px] py-4">
					<Text className="font-hanken-semibold text-[14.5px] text-foreground">{passkey.name}</Text>
					{passkey.createdLabel ? (
						<Text className="mt-1.5 font-geist-mono text-[11.5px] text-foreground/45">
							{passkey.createdLabel}
						</Text>
					) : null}
				</View>
			) : null}
			{warning ? (
				<View className="mt-4 rounded-xl bg-warning/10 px-4 py-3">
					<Text className="font-hanken text-[12.5px] leading-5 text-warning">{warning}</Text>
				</View>
			) : null}
			{error ? <ErrorText message={error} /> : null}
			<Pressable
				accessibilityRole="button"
				accessibilityLabel={copy.confirm}
				accessibilityState={{ disabled: pending }}
				disabled={pending}
				onPress={onConfirm}
				className="mt-[22px] items-center rounded-xl bg-danger py-4 active:opacity-80"
			>
				<Text className="font-hanken-semibold text-[15px] text-background">{copy.confirm}</Text>
			</Pressable>
			<Pressable
				accessibilityRole="button"
				accessibilityLabel="Cancelar"
				disabled={pending}
				onPress={onDismiss}
				className="mt-2.5 items-center rounded-xl border border-line py-[15px] active:opacity-60"
			>
				<Text className="font-hanken-semibold text-[15px] text-foreground">Cancelar</Text>
			</Pressable>
		</View>
	);
}
