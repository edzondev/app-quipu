/** Misma marca que `@better-auth/expo` cuando parte un valor de SecureStore. */
export const CHUNK_MARKER = "\u0001ba-chunks:";

/**
 * Better Auth parte valores de más de 1800 caracteres. El tope cubre una sesión
 * real y los trozos que quedan si un cierre anterior reescribió la clave base.
 */
export const MAX_STORAGE_CHUNKS = 8;

const SESSION_KEY_SUFFIXES = ["_cookie", "_session_data"] as const;

/** Puerta de entrada sin sesión. La misma ruta que usa OnboardingGate. */
export const SIGNED_OUT_HREF = "/(onboarding)";

/** Aviso fijo cuando el teléfono ya olvidó la sesión y el servidor no se enteró. */
export const OFFLINE_SIGN_OUT_MESSAGE =
	"Cerraste sesión en este teléfono. No pudimos avisar al servidor; se cerrará sola cuando venza.";

export type AuthSessionSnapshot = {
	data: unknown;
	error: unknown;
	isPending: boolean;
};

export function clearedAuthSession<T extends AuthSessionSnapshot>(current: T): T {
	return { ...current, data: null, error: null, isPending: false };
}

let offlineNotice: string | null = null;

export function noteOfflineSignOut() {
	offlineNotice = OFFLINE_SIGN_OUT_MESSAGE;
}

export function takeOfflineSignOutNotice(): string | null {
	const current = offlineNotice;
	offlineNotice = null;
	return current;
}

export type DeviceSessionDeps = {
	storagePrefix: string;
	signOut: () => Promise<unknown>;
	readSecure: (key: string) => Promise<string | null>;
	deleteSecure: (key: string) => Promise<void>;
	resetConvex: () => void;
	clearMemorySession: () => void;
};

export type DeviceSignOutResult = {
	serverNotified: boolean;
};

function chunkCount(stored: string | null): number {
	if (!stored?.startsWith(CHUNK_MARKER)) return MAX_STORAGE_CHUNKS;
	const parsed = Number(stored.slice(CHUNK_MARKER.length));
	if (!Number.isInteger(parsed) || parsed < 1) return MAX_STORAGE_CHUNKS;
	return Math.max(parsed, MAX_STORAGE_CHUNKS);
}

export function secureKeysFor(prefix: string, stored: Record<string, string | null>): string[] {
	const keys: string[] = [];
	for (const suffix of SESSION_KEY_SUFFIXES) {
		const base = `${prefix}${suffix}`;
		keys.push(base);
		const count = chunkCount(stored[base] ?? null);
		for (let index = 0; index < count; index++) keys.push(`${base}.${index}`);
	}
	return keys;
}

export async function signOutAndClearDevice(deps: DeviceSessionDeps): Promise<DeviceSignOutResult> {
	let serverNotified = true;
	try {
		await deps.signOut();
	} catch {
		// El átomo de Better Auth sigue con la sesión si el fetch ni siquiera arranca.
		serverNotified = false;
		deps.clearMemorySession();
	}

	const stored: Record<string, string | null> = {};
	await Promise.all(
		SESSION_KEY_SUFFIXES.map(async (suffix) => {
			const base = `${deps.storagePrefix}${suffix}`;
			try {
				stored[base] = await deps.readSecure(base);
			} catch {
				stored[base] = null;
			}
		}),
	);

	await Promise.all(
		secureKeysFor(deps.storagePrefix, stored).map(async (key) => {
			try {
				await deps.deleteSecure(key);
			} catch {
				// Una clave no puede dejar el resto.
			}
		}),
	);

	deps.resetConvex();
	return { serverNotified };
}
