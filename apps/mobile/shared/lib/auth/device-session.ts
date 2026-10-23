const SESSION_KEY_SUFFIXES = ["_cookie", "_session_data"] as const;

export const MAX_STORAGE_CHUNKS = 8;

/** Puerta de entrada sin sesión. La misma ruta que usa OnboardingGate. */
export const SIGNED_OUT_HREF = "/(onboarding)";

/** Aviso fijo cuando el teléfono ya olvidó la sesión y el servidor no se enteró. */
export const OFFLINE_SIGN_OUT_MESSAGE =
	"Saliste de este teléfono. No pudimos avisar a Quipu, así que la sesión vencerá sola en unos días.";

/** Aviso breve al volver a Entrar después de borrar la cuenta. */
export const ACCOUNT_DELETED_MESSAGE = "Tu cuenta fue eliminada.";

function noticeValue(notice: unknown): unknown {
	return Array.isArray(notice) ? notice[0] : notice;
}

/** Expo Router puede mandar el query como string o como lista. */
export function offlineSignOutNotice(notice: unknown): string | null {
	if (noticeValue(notice) !== "offline") return null;
	return OFFLINE_SIGN_OUT_MESSAGE;
}

export function accountDeletedNotice(notice: unknown): string | null {
	if (noticeValue(notice) !== "deleted") return null;
	return ACCOUNT_DELETED_MESSAGE;
}

/** Espera máxima a Better Auth antes de decidir que el servidor no se enteró. */
export const SERVER_SIGN_OUT_WAIT_MS = 3000;

export type AuthSessionSnapshot = {
	data: unknown;
	error: unknown;
	isPending: boolean;
};

export function clearedAuthSession<T extends AuthSessionSnapshot>(current: T): T {
	return { ...current, data: null, error: null, isPending: false };
}

type DeviceSessionDeps = {
	storagePrefix: string;
	signOut: () => Promise<unknown>;
	deleteSecure: (key: string) => Promise<void>;
	resetConvex: () => void;
	clearMemorySession: () => void;
	settleListener: () => Promise<void>;
};

export type DeviceSignOutResult = {
	serverNotified: boolean;
};

export function signedOutHref(serverNotified: boolean) {
	if (serverNotified) return SIGNED_OUT_HREF;
	return {
		pathname: SIGNED_OUT_HREF,
		params: { notice: "offline" },
	} as const;
}

function secureKeysFor(prefix: string) {
	const keys: string[] = [];
	for (const suffix of SESSION_KEY_SUFFIXES) {
		const base = `${prefix}${suffix}`;
		keys.push(base);
		for (let index = 0; index < MAX_STORAGE_CHUNKS; index++) keys.push(`${base}.${index}`);
	}
	return keys;
}

export async function signOutAndClearDevice(deps: DeviceSessionDeps): Promise<DeviceSignOutResult> {
	const server = deps.signOut().then(
		() => true,
		() => false,
	);
	let timer: ReturnType<typeof setTimeout> | undefined;
	const timeout = new Promise<boolean>((resolve) => {
		timer = setTimeout(() => resolve(false), SERVER_SIGN_OUT_WAIT_MS);
	});
	const serverNotified = await Promise.race([server, timeout]);
	clearTimeout(timer);
	await Promise.all(
		secureKeysFor(deps.storagePrefix).map(async (key) => {
			try {
				await deps.deleteSecure(key);
			} catch {
				// Una clave no puede dejar el resto.
			}
		}),
	);
	deps.clearMemorySession();
	await deps.settleListener();
	deps.resetConvex();
	return { serverNotified };
}
