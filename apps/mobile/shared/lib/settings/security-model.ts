import type { api } from "@quipu/convex-api";
import type { FunctionReturnType } from "convex/server";
import { limaDayLabel, limaStamp } from "@/shared/lib/lima-date";

type PasskeyList = NonNullable<FunctionReturnType<typeof api.settings.listMyPasskeys>>;
type SessionList = NonNullable<FunctionReturnType<typeof api.settings.listMySessions>>;
type SettingsOverview = NonNullable<FunctionReturnType<typeof api.settings.getSettingsOverview>>;

export type SecurityBackup = Pick<SettingsOverview["security"], "hasPassword" | "emailVerified">;

export type SecurityPasskeyRow = {
	id: string;
	name: string;
	createdLabel: string | null;
};

export type SecuritySessionRow = {
	id: string;
	device: string;
	activity: string;
	isCurrent: boolean;
};

export type SecurityScreenModel = {
	passkeys: SecurityPasskeyRow[] | null;
	sessions: SecuritySessionRow[] | null;
	passwordLabel: string;
	emailLabel: string;
	emailVerified: boolean;
};

const DAY_MS = 86_400_000;
const GENERIC_DEVICE = "Dispositivo";
const GENERIC_PASSKEY = "Passkey";

export function deviceLabelFromUserAgent(userAgent: string | null): string {
	const ua = userAgent?.trim() ?? "";
	if (!ua) return GENERIC_DEVICE;
	if (/iPhone/i.test(ua)) return "iPhone";
	if (/iPad/i.test(ua)) return "iPad";
	if (/Android/i.test(ua)) return "Android";
	if (/Edg\//i.test(ua)) return "Edge";
	if (/Chrome\//i.test(ua)) return "Chrome";
	if (/Firefox\//i.test(ua)) return "Firefox";
	if (/Safari\//i.test(ua)) return "Safari";
	if (/Macintosh|Mac OS X/i.test(ua)) return "Mac";
	if (/Windows/i.test(ua)) return "Windows";
	return GENERIC_DEVICE;
}

export function passkeyName(label: string | null): string {
	const trimmed = label?.trim() ?? "";
	return trimmed.length > 0 ? trimmed : GENERIC_PASSKEY;
}

export function passkeyCreatedCopy(createdAt: number | null): string | null {
	if (createdAt == null) return null;
	return `CREADA ${limaDayLabel(createdAt)}`;
}

/** Días de calendario en Lima entre `at` y `now`. */
function limaDayDelta(at: number, now: number): number {
	const from = Date.parse(`${limaStamp(at).key}T00:00:00Z`);
	const to = Date.parse(`${limaStamp(now).key}T00:00:00Z`);
	return Math.round((to - from) / DAY_MS);
}

export function limaActivityLabel(at: number, now: number): string {
	const delta = limaDayDelta(at, now);
	if (delta <= 0) return "HOY";
	if (delta === 1) return "AYER";
	if (delta < 7) return `HACE ${delta} DÍAS`;
	return limaDayLabel(at);
}

export function sessionActivityCopy(isCurrent: boolean, updatedAt: number, now: number): string {
	const activity = limaActivityLabel(updatedAt, now);
	if (!isCurrent) return activity;
	return `ESTE DISPOSITIVO · ${activity}`;
}

export function remainingPasskeysCopy(remaining: number): string {
	if (remaining === 1) return "Te quedará 1 Passkey";
	return `Te quedarán ${remaining} Passkeys`;
}

/** Aviso de respaldo al dejar 1 o 0 llaves. `null` si todavía quedan varias. */
export function passkeyDeleteWarning(remaining: number): string | null {
	if (remaining > 1) return null;
	if (remaining === 1) {
		return `${remainingPasskeysCopy(remaining)}. Si la pierdes, entrarás con tu contraseña de respaldo.`;
	}
	return "Esta es tu última Passkey. Si la borras, entrarás con tu contraseña de respaldo.";
}

export function passwordBackupLabel(hasPassword: boolean): string {
	return hasPassword ? "Definida" : "Sin definir";
}

export function emailBackupLabel(emailVerified: boolean): string {
	return emailVerified ? "Verificado" : "Sin verificar";
}

export function presentSecurity(input: {
	passkeys: PasskeyList;
	sessions: SessionList;
	backup: SecurityBackup;
	now: number;
}): SecurityScreenModel {
	const passkeys =
		input.passkeys.passkeysSource === "better_auth"
			? input.passkeys.passkeys.map((passkey) => ({
					id: passkey.id,
					name: passkeyName(passkey.label),
					createdLabel: passkeyCreatedCopy(passkey.createdAt),
				}))
			: null;
	const sessions = input.sessions.apiReady
		? input.sessions.sessions.map((session) => ({
				id: session.id,
				device: deviceLabelFromUserAgent(session.userAgent),
				activity: sessionActivityCopy(session.isCurrent, session.updatedAt, input.now),
				isCurrent: session.isCurrent,
			}))
		: null;
	return {
		passkeys,
		sessions,
		passwordLabel: passwordBackupLabel(input.backup.hasPassword),
		emailLabel: emailBackupLabel(input.backup.emailVerified),
		emailVerified: input.backup.emailVerified,
	};
}
