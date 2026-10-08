/**
 * Errores tipados del sistema.
 *
 * Reglas:
 *   1. Toda capa que pueda fallar lanza una subclase de `AppError`.
 *   2. Cada error tiene un `code` único (string literal) para discriminación
 *      sin parsear mensajes.
 *   3. El cliente usa `instanceof` para mapear a UI; nunca compara strings.
 *
 * Convex lanza `ConvexError` con un shape `{ code, message }` desde el backend.
 * Este módulo define las clases que el cliente usa para envolver esos errores.
 */

export type ErrorCode =
	// Auth
	| "UNAUTHORIZED"
	| "FORBIDDEN"
	| "SESSION_EXPIRED"
	| "AUTH_PASSKEY_SECURITY_ERROR"
	| "AUTH_PASSKEY_NETWORK_ERROR"
	| "AUTH_PASSKEY_EXPIRED"
	| "AUTH_USER_NOT_FOUND"
	| "AUTH_INVALID_CREDENTIALS"
	| "AUTH_EMAIL_TAKEN"
	| "AUTH_UNKNOWN_ERROR"
	// Validación
	| "VALIDATION_ERROR"
	| "INVALID_INPUT"
	// Recurso
	| "NOT_FOUND"
	| "ALREADY_EXISTS"
	| "CONFLICT"
	// Regla de negocio
	| "NO_ACTIVE_CYCLE"
	| "CYCLE_ALREADY_CLOSED"
	| "INSUFFICIENT_FUNDS"
	| "INSUFFICIENT_ENVELOPE_BALANCE"
	| "OVER_BUDGET_LIMIT"
	// Plan / facturación
	| "PLAN_REQUIRED"
	// Espacios compartidos (Modo Pareja)
	| "CURRENCY_MISMATCH"
	| "SPACE_MEMBER_LIMIT"
	| "SPACE_READONLY"
	| "SPACE_PROPOSAL_PENDING"
	| "SPACE_NOT_MEMBER"
	// Sistema
	| "INTERNAL_ERROR"
	| "EXTERNAL_SERVICE_ERROR"
	| "RATE_LIMITED";

/**
 * Error base. Todos los errores de la app extienden de este.
 */
export class AppError extends Error {
	readonly code: ErrorCode;
	readonly meta?: Record<string, unknown>;

	constructor(
		code: ErrorCode,
		message: string,
		options?: { meta?: Record<string, unknown>; cause?: unknown },
	) {
		super(message, options?.cause ? { cause: options.cause } : undefined);
		this.name = this.constructor.name;
		this.code = code;
		this.meta = options?.meta;
	}

	/**
	 * Convierte el error a un payload seguro para enviar al cliente.
	 * Nunca expone stack traces ni mensajes crudos de infraestructura.
	 */
	toJSON(): {
		code: ErrorCode;
		message: string;
		meta?: Record<string, unknown>;
	} {
		return {
			code: this.code,
			message: this.message,
			...(this.meta ? { meta: this.meta } : {}),
		};
	}
}

// ─── Sistema ───────────────────────────────────────────────────────────────

export class InternalError extends AppError {
	constructor(message = "Error interno del servidor", cause?: unknown) {
		super("INTERNAL_ERROR", message, { cause });
	}
}

// ─── Helpers ───────────────────────────────────────────────────────────────

/**
 * Mapea un error desconocido a un `AppError`. Útil en catch blocks donde
 * el tipo del error es `unknown`.
 */
export function toAppError(error: unknown): AppError {
	if (error instanceof AppError) return error;
	if (error instanceof Error) {
		// El message crudo puede filtrar internals del backend a la UI
		// (nombres de funciones, paths). Se conserva solo como `cause`
		// para debugging; el usuario ve el mensaje genérico.
		return new InternalError(undefined, error);
	}
	return new InternalError("Error desconocido");
}

/**
 * Discrimina errores de Convex (que vienen como `ConvexError`) a `AppError`.
 *
 * El backend debe lanzar `ConvexError({ code, message, meta? })` con códigos
 * válidos del enum `ErrorCode`. El cliente crea siempre un `AppError` base con
 * el `code` correspondiente: las subclases específicas se usan cuando se
 * construyen errores desde el cliente; para errores del backend, basta con
 * `error.code` para discriminar.
 */
export function fromConvexError(error: unknown): AppError {
	// ConvexError tiene un shape específico: { data: unknown, message: string }.
	if (error && typeof error === "object" && "data" in error) {
		const data = (error as { data: unknown }).data;
		if (data && typeof data === "object" && "code" in data) {
			const code = (data as { code: ErrorCode }).code;
			const message = (data as { message?: string }).message ?? "Error del servidor";
			const meta = (data as { meta?: Record<string, unknown> }).meta;
			return new AppError(code, message, { meta });
		}
	}
	return toAppError(error);
}
