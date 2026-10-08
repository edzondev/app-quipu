import type { api } from "@quipu/convex-api";
import type { FunctionReturnType } from "convex/server";

// El id de passkey y de sesión es el string que devuelve Better Auth.
type PasskeyList = NonNullable<FunctionReturnType<typeof api.settings.listMyPasskeys>>;
type SessionList = NonNullable<FunctionReturnType<typeof api.settings.listMySessions>>;

export type SecurityPasskey = PasskeyList["passkeys"][number];
export type SecuritySession = SessionList["sessions"][number];

/** 3 jun 2026, 12:00 en Lima. */
export const PASSKEY_CREATED_AT = Date.UTC(2026, 5, 3, 17, 0, 0);
/** 16 ago 2026, 12:00 en Lima. */
export const SECURITY_NOW = Date.UTC(2026, 7, 16, 17, 0, 0);

const IPHONE_UA =
	"Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 Version/17.5 Mobile/15E148 Safari/604.1";
const CHROME_UA =
	"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 SecretAgentToken";

export function securityPasskey(overrides: Partial<SecurityPasskey> = {}): SecurityPasskey {
	const passkey = {
		id: "pk-phone",
		name: null,
		label: "Llave del teléfono",
		deviceType: "singleDevice",
		backedUp: true,
		createdAt: PASSKEY_CREATED_AT,
		...overrides,
	} satisfies SecurityPasskey;
	return passkey;
}

export function securitySession(overrides: Partial<SecuritySession> = {}): SecuritySession {
	const session = {
		id: "sess-other",
		createdAt: PASSKEY_CREATED_AT,
		updatedAt: Date.UTC(2026, 7, 13, 17, 0, 0),
		userAgent: CHROME_UA,
		isCurrent: false,
		...overrides,
	} satisfies SecuritySession;
	return session;
}

export function passkeyList(
	options: { source?: PasskeyList["passkeysSource"]; passkeys?: SecurityPasskey[] } = {},
): PasskeyList {
	const list = {
		passkeys: options.passkeys ?? [securityPasskey()],
		passkeysSource: options.source ?? "better_auth",
	} satisfies PasskeyList;
	return list;
}

export function sessionList(
	options: { apiReady?: boolean; sessions?: SecuritySession[] } = {},
): SessionList {
	const list = {
		sessions: options.sessions ?? [
			securitySession({
				id: "sess-current",
				userAgent: IPHONE_UA,
				isCurrent: true,
				updatedAt: SECURITY_NOW,
			}),
			securitySession(),
		],
		apiReady: options.apiReady ?? true,
	} satisfies SessionList;
	return list;
}
