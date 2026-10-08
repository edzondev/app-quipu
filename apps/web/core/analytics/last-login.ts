/**
 * Tracking del último login del usuario.
 *
 * Se usa en `user_logged_in` para enviar `days_since_last_login` sin
 * tener que consultar Better Auth en el cliente. La primera vez el
 * delta es 0 (no es un "retorno"); a partir de la segunda, es real.
 *
 * Almacenamiento: `localStorage` con clave estable. Si no existe (primer
 * login, modo incógnito, storage lleno), devuelve 0.
 */

const LAST_LOGIN_KEY = "qp:last_login_at";
const DAY_MS = 24 * 60 * 60 * 1000;

export function readLastLoginTimestamp(): number | null {
	if (typeof window === "undefined") return null;
	try {
		const raw = window.localStorage.getItem(LAST_LOGIN_KEY);
		if (!raw) return null;
		const parsed = Number.parseInt(raw, 10);
		return Number.isFinite(parsed) ? parsed : null;
	} catch {
		return null;
	}
}

export function writeLastLoginTimestamp(timestamp: number = Date.now()): void {
	if (typeof window === "undefined") return;
	try {
		window.localStorage.setItem(LAST_LOGIN_KEY, String(timestamp));
	} catch {
		// storage lleno / bloqueado: no es fatal
	}
}

/**
 * Días desde el último login, redondeado hacia arriba. 0 si no hay
 * registro previo.
 */
export function daysSinceLastLogin(now: number = Date.now()): number {
	const last = readLastLoginTimestamp();
	if (last === null) return 0;
	const delta = now - last;
	if (delta <= 0) return 0;
	return Math.ceil(delta / DAY_MS);
}

/**
 * Side-effect helper: lee el delta, persiste el nuevo timestamp y devuelve
 * el delta. Usar inmediatamente antes/después de `track(USER_LOGGED_IN, …)`.
 */
export function stampAndComputeDaysSinceLastLogin(now: number = Date.now()): number {
	const days = daysSinceLastLogin(now);
	writeLastLoginTimestamp(now);
	return days;
}
