import { BottomSheet, RNHostView } from "@expo/ui";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { ErrorText } from "@/shared/components/forms/field-error";
import { ListRow } from "@/shared/components/list-row";
import { SectionLabel } from "@/shared/components/section-label";
import { ChevronLeft } from "@/shared/components/ui/reicon";
import { readActionError } from "@/shared/lib/expenses/errors";
import { HIT_SLOP } from "@/shared/lib/hit-slop";
import {
	passkeyDeleteWarning,
	type SecurityPasskeyRow,
	type SecurityScreenModel,
	type SecuritySessionRow,
} from "@/shared/lib/settings/security-model";

const INTRO = "Cada dispositivo tiene su propia llave. Puedes quitar la que ya no uses.";

type Props = {
	status: "loading" | "empty" | "ready";
	model: SecurityScreenModel | null;
	onBack: () => void;
	onAddPasskey: () => Promise<unknown>;
	onDeletePasskey: (id: string) => Promise<unknown>;
	onRevokeSession: (sessionId: string) => Promise<unknown>;
	onRevokeAll: () => Promise<unknown>;
};

type Confirm =
	| {
			kind: "passkey";
			id: string;
			name: string;
			createdLabel: string | null;
			remaining: number;
	  }
	| { kind: "sessions" };

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

	function openPasskey(passkey: SecurityPasskeyRow) {
		const count = model?.passkeys?.length ?? 0;
		setError(null);
		setConfirm({
			kind: "passkey",
			id: passkey.id,
			name: passkey.name,
			createdLabel: passkey.createdLabel,
			remaining: Math.max(0, count - 1),
		});
	}

	const warning = confirm?.kind === "passkey" ? passkeyDeleteWarning(confirm.remaining) : null;

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
						onOpen={openPasskey}
						onAdd={() => void run(onAddPasskey, "No pudimos agregar la Passkey. Intenta de nuevo.")}
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
						onClose={(sessionId) =>
							void run(
								() => onRevokeSession(sessionId),
								"No pudimos cerrar la sesión. Intenta de nuevo.",
							)
						}
						onCloseAll={() => {
							setError(null);
							setConfirm({ kind: "sessions" });
						}}
					/>
				</ScrollView>
			) : null}

			<BottomSheet isPresented={confirm != null} onDismiss={() => setConfirm(null)}>
				<RNHostView>
					{confirm ? (
						<ConfirmSheet
							confirm={confirm}
							warning={warning}
							error={error}
							pending={pending}
							onDismiss={() => setConfirm(null)}
							onConfirm={() => {
								if (confirm.kind === "passkey") {
									void run(
										() => onDeletePasskey(confirm.id),
										"No pudimos eliminar la Passkey. Intenta de nuevo.",
									);
									return;
								}
								void run(onRevokeAll, "No pudimos cerrar las sesiones. Intenta de nuevo.");
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
		return <Text className="mt-4 font-hanken text-[15px] text-foreground/55">No disponible</Text>;
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
	onClose,
	onCloseAll,
}: {
	sessions: SecuritySessionRow[] | null;
	onClose: (sessionId: string) => void;
	onCloseAll: () => void;
}) {
	if (!sessions) {
		return (
			<View className="mt-4 border-t border-line pt-4">
				<SectionLabel>SESIONES ACTIVAS</SectionLabel>
				<Text className="mt-3 font-hanken text-[15px] text-foreground/55">No disponible</Text>
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
					<SessionRow
						key={session.id}
						session={session}
						isLast={index === sessions.length - 1}
						onClose={session.isCurrent ? null : () => onClose(session.id)}
					/>
				))
			)}
			<Pressable
				accessibilityRole="button"
				accessibilityLabel="Cerrar todas las sesiones"
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

function SessionRow({
	session,
	isLast,
	onClose,
}: {
	session: SecuritySessionRow;
	isLast: boolean;
	onClose: (() => void) | null;
}) {
	return (
		<View
			className={`flex-row items-center justify-between py-3.5 ${
				isLast ? "" : "border-b border-foreground/10"
			}`}
		>
			<View className="min-w-0 flex-1 pr-3">
				<Text className="font-hanken-semibold text-[14.5px] text-foreground">{session.device}</Text>
				<Text
					className={`mt-1.5 font-geist-mono text-[11.5px] ${
						session.isCurrent ? "text-primary" : "text-foreground/45"
					}`}
				>
					{session.activity}
				</Text>
			</View>
			{onClose ? (
				<Pressable
					accessibilityRole="button"
					accessibilityLabel={`Cerrar sesión de ${session.device}`}
					hitSlop={HIT_SLOP}
					onPress={onClose}
					className="active:opacity-60"
				>
					<Text className="font-hanken-semibold text-[13.5px] text-danger">Cerrar</Text>
				</Pressable>
			) : null}
		</View>
	);
}

function ConfirmSheet({
	confirm,
	warning,
	error,
	pending,
	onDismiss,
	onConfirm,
}: {
	confirm: Confirm;
	warning: string | null;
	error: string | null;
	pending: boolean;
	onDismiss: () => void;
	onConfirm: () => void;
}) {
	const passkey = confirm.kind === "passkey" ? confirm : null;
	const confirmLabel = passkey ? "Eliminar Passkey" : "Cerrar todas";
	return (
		<View className="bg-background px-5.5 pb-8 pt-3">
			<View className="border-l-2 border-danger pl-3.5">
				<Text className="font-geist-mono text-[10.5px] tracking-[0.14em] text-danger">
					{passkey ? "ELIMINAR PASSKEY" : "CERRAR SESIONES"}
				</Text>
				<Text className="mt-3 font-newsreader text-[23px] leading-8 text-foreground">
					{passkey
						? `Vas a quitar la llave de ${passkey.name}.`
						: "Vas a cerrar todas las sesiones."}
				</Text>
			</View>
			<Text className="mt-3.5 font-hanken text-[14.5px] leading-6 text-foreground/55">
				{passkey
					? "Ese dispositivo dejará de entrar con esta Passkey. Podrás volver a crearla cuando quieras."
					: "Se cerrará la sesión en todos los dispositivos, incluido este."}
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
				accessibilityLabel={confirmLabel}
				accessibilityState={{ disabled: pending }}
				disabled={pending}
				onPress={onConfirm}
				className="mt-[22px] items-center rounded-xl bg-danger py-4 active:opacity-80"
			>
				<Text className="font-hanken-semibold text-[15px] text-background">{confirmLabel}</Text>
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
