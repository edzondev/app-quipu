import type { api } from "@quipu/convex-api";
import type { FunctionReturnType } from "convex/server";
import { limaDayLabel, limaStamp } from "@/shared/lib/lima-date";

type SessionList = NonNullable<FunctionReturnType<typeof api.settings.listMySessions>>;
type SettingsOverview = NonNullable<FunctionReturnType<typeof api.settings.getSettingsOverview>>;

export type SecuritySection = Pick<
	SettingsOverview["security"],
	"passkeys" | "passkeysSource" | "hasPassword" | "emailVerified"
>;

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

export const SECURITY_ERROR = {
	add: "No pudimos agregar la Passkey. Intenta de nuevo.",
	remove: "No pudimos eliminar la Passkey. Intenta de nuevo.",
	revoke: "No pudimos cerrar la sesión. Intenta de nuevo.",
	revokeAll: "No pudimos cerrar las sesiones. Intenta de nuevo.",
} as const;

const DAY_MS = 86_400_000;
const GENERIC_DEVICE = "Dispositivo";

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
	if (/okhttp/i.test(ua)) return "Android";
	return GENERIC_DEVICE;
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

export function presentSecurity(input: {
	security: SecuritySection;
	sessions: SessionList;
	now: number;
}): SecurityScreenModel {
	const passkeys =
		input.security.passkeysSource === "better_auth"
			? input.security.passkeys.map((passkey) => ({
					id: passkey.id,
					name: passkey.label ?? "Passkey",
					createdLabel:
						passkey.createdAt == null ? null : `CREADA ${limaDayLabel(passkey.createdAt)}`,
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
		passwordLabel: input.security.hasPassword ? "Definida" : "Sin definir",
		emailLabel: input.security.emailVerified ? "Verificado" : "Sin verificar",
		emailVerified: input.security.emailVerified,
	};
}
