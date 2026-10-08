import { getAuthenticatorName } from "@better-auth/passkey";
import { type Infer, v } from "convex/values";

/** Tope de filas por lectura. Las tablas de Better Auth ya indexan `userId`. */
export const AUTH_RECORD_LIMIT = 50;

export const CREDENTIAL_PROVIDER_ID = "credential";

export const publicSessionValidator = v.object({
	id: v.string(),
	createdAt: v.number(),
	updatedAt: v.number(),
	userAgent: v.union(v.string(), v.null()),
	isCurrent: v.boolean(),
});

export type PublicSession = Infer<typeof publicSessionValidator>;

export const sessionListValidator = v.object({
	sessions: v.array(publicSessionValidator),
	apiReady: v.boolean(),
});

export type SessionList = Infer<typeof sessionListValidator>;

export const publicPasskeyValidator = v.object({
	id: v.string(),
	name: v.union(v.string(), v.null()),
	label: v.union(v.string(), v.null()),
	deviceType: v.string(),
	backedUp: v.boolean(),
	createdAt: v.union(v.number(), v.null()),
});

export type PublicPasskey = Infer<typeof publicPasskeyValidator>;

export const passkeyListValidator = v.object({
	passkeys: v.array(publicPasskeyValidator),
	passkeysSource: v.union(v.literal("better_auth"), v.literal("unavailable")),
});

export type PasskeyList = Infer<typeof passkeyListValidator>;

export const securityBackupValidator = v.object({
	hasPassword: v.boolean(),
	emailVerified: v.boolean(),
});

export type SecurityBackup = Infer<typeof securityBackupValidator>;

export const sessionSummaryValidator = v.object({
	count: v.number(),
	apiReady: sessionListValidator.fields.apiReady,
});

export const securitySectionValidator = v
	.object({
		sessions: sessionSummaryValidator,
	})
	.extend(passkeyListValidator.fields)
	.extend(securityBackupValidator.fields);

export const revokeSessionResultValidator = v.object({
	success: v.literal(true),
});

export type RevokeSessionResult = Infer<typeof revokeSessionResultValidator>;

export type RevokeBlock = "NOT_FOUND" | "CURRENT_SESSION";

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(record: Record<string, unknown>, key: string): string | null {
	const value = record[key];
	return typeof value === "string" ? value : null;
}

function readNumber(record: Record<string, unknown>, key: string): number | null {
	const value = record[key];
	return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function nonBlank(value: string | null | undefined): string | null {
	if (typeof value !== "string") return null;
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : null;
}

/**
 * `sessionId` del JWT es el `_id` del documento de sesión.
 * @convex-dev/better-auth lo escribe como `session.id` y el adapter mapea `id` ↔ `_id`.
 */
export function readSessionId(sessionId: unknown): string | null {
	return nonBlank(typeof sessionId === "string" ? sessionId : null);
}

export function readAdapterPage(result: unknown): unknown[] {
	if (!isRecord(result)) return [];
	return Array.isArray(result.page) ? result.page : [];
}

/**
 * `db.get` no filtra por tabla. Solo la sesión tiene `token` y `expiresAt`;
 * se leen para reconocerla y no se devuelven.
 */
export function readSessionOwnerId(session: unknown): string | null {
	if (!isRecord(session)) return null;
	const token = readString(session, "token");
	if (token === null || token.length === 0 || readNumber(session, "expiresAt") === null)
		return null;
	return nonBlank(readString(session, "userId"));
}

/** `db.get` lanza esto si el `_id` no se puede decodificar. Un id válido ausente devuelve null. */
export function isUndecodableDocumentId(error: unknown): boolean {
	if (!isRecord(error)) return false;
	return typeof error.message === "string" && error.message.includes("Unable to decode ID");
}

export function toPublicSession(
	row: unknown,
	currentSessionId: string | null,
	now: number,
): PublicSession | null {
	if (!isRecord(row)) return null;
	const id = nonBlank(readString(row, "_id") ?? readString(row, "id"));
	if (!id) return null;
	const expiresAt = readNumber(row, "expiresAt");
	if (expiresAt === null || expiresAt <= now) return null;
	const createdAt = readNumber(row, "createdAt") ?? 0;
	const updatedAt = readNumber(row, "updatedAt") ?? createdAt;
	const session: PublicSession = {
		id,
		createdAt,
		updatedAt,
		userAgent: readString(row, "userAgent"),
		isCurrent: currentSessionId !== null && id === currentSessionId,
	};
	return session;
}

export function toPublicSessions(
	rows: unknown[],
	currentSessionId: string | null,
	now: number,
): PublicSession[] {
	const sessions: PublicSession[] = [];
	for (const row of rows) {
		const session = toPublicSession(row, currentSessionId, now);
		if (session) sessions.push(session);
	}
	return sessions.sort((left, right) => Number(right.isCurrent) - Number(left.isCurrent));
}

export function sessionRevokeBlock(input: {
	callerUserId: string;
	currentSessionId: string | null;
	sessionId: string;
	sessionUserId: string | null;
}): RevokeBlock | null {
	if (input.sessionUserId === null || input.sessionUserId !== input.callerUserId) {
		return "NOT_FOUND";
	}
	if (input.currentSessionId !== null && input.sessionId === input.currentSessionId) {
		return "CURRENT_SESSION";
	}
	return null;
}

export function passkeyLabel(name: string | null, aaguid: string | null): string | null {
	const named = nonBlank(name);
	if (named) return named;
	return nonBlank(getAuthenticatorName(aaguid));
}

export function toPublicPasskey(row: unknown): PublicPasskey | null {
	if (!isRecord(row)) return null;
	const id = nonBlank(readString(row, "_id") ?? readString(row, "id"));
	if (!id) return null;
	const name = readString(row, "name");
	const aaguid = readString(row, "aaguid");
	const createdAt = readNumber(row, "createdAt");
	return {
		id,
		name,
		label: passkeyLabel(name, aaguid),
		deviceType: nonBlank(readString(row, "deviceType")) ?? "unknown",
		backedUp: row.backedUp === true,
		createdAt,
	};
}

export function toPublicPasskeys(rows: unknown[]): PublicPasskey[] {
	const passkeys: PublicPasskey[] = [];
	for (const row of rows) {
		const passkey = toPublicPasskey(row);
		if (passkey) passkeys.push(passkey);
	}
	return passkeys;
}

export function hasCredentialProvider(account: unknown): boolean {
	if (!isRecord(account)) return false;
	return readString(account, "providerId") === CREDENTIAL_PROVIDER_ID;
}

export function readEmailVerified(user: unknown): boolean {
	if (!isRecord(user)) return false;
	return user.emailVerified === true;
}

export function securityBackup(account: unknown, user: unknown): SecurityBackup {
	return {
		hasPassword: hasCredentialProvider(account),
		emailVerified: readEmailVerified(user),
	};
}
