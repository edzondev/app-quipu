import { describe, expect, it } from "vitest";
import {
	hasCredentialProvider,
	passkeyLabel,
	readEmailVerified,
	readSessionId,
	readSessionOwnerId,
	securityBackup,
	sessionRevokeBlock,
	toPublicPasskey,
	toPublicSessions,
} from "./securityDevices";

const FUTURE = 9_000_000_000_000;
const APPLE_AAGUID = "fbfc3007-154e-4ecc-8c0b-6e020557d7bd";

function sessionRow(id: string, extra: Record<string, unknown> = {}) {
	return {
		_id: id,
		token: `token-${id}`,
		ipAddress: `203.0.113.${id.length}`,
		userAgent: `Agent ${id}`,
		createdAt: 10,
		updatedAt: 20,
		expiresAt: FUTURE,
		userId: "user-a",
		...extra,
	};
}

describe("toPublicSessions", () => {
	it("marca la sesión del JWT y la pone primero", () => {
		const sessions = toPublicSessions(
			[sessionRow("sess-a"), sessionRow("sess-current", { updatedAt: 5 })],
			"sess-current",
			1_000,
		);

		expect(sessions.map((session) => session.id)).toEqual(["sess-current", "sess-a"]);
		expect(sessions[0]?.isCurrent).toBe(true);
		expect(sessions[1]?.isCurrent).toBe(false);
		expect(sessions[0]).toEqual({
			id: "sess-current",
			createdAt: 10,
			updatedAt: 5,
			userAgent: "Agent sess-current",
			isCurrent: true,
		});
	});

	it("no incluye token ni ipAddress", () => {
		const sessions = toPublicSessions([sessionRow("sess-a")], "otra", 1_000);
		const encoded = JSON.stringify(sessions);

		expect(sessions[0] && Object.keys(sessions[0]).sort()).toEqual([
			"createdAt",
			"id",
			"isCurrent",
			"updatedAt",
			"userAgent",
		]);
		expect(encoded).not.toContain("token-sess-a");
		expect(encoded).not.toContain("203.0.113.");
		expect(encoded).not.toContain("ipAddress");
		expect(encoded).not.toContain("token");
	});

	it("omite sesiones vencidas", () => {
		const sessions = toPublicSessions(
			[sessionRow("vencida", { expiresAt: 50 }), sessionRow("viva")],
			null,
			100,
		);
		expect(sessions.map((session) => session.id)).toEqual(["viva"]);
	});
});

describe("sessionRevokeBlock", () => {
	it("responde NOT_FOUND si la sesión es de otro usuario", () => {
		expect(
			sessionRevokeBlock({
				callerUserId: "user-a",
				currentSessionId: "sess-current",
				sessionId: "sess-ajena",
				sessionUserId: "user-b",
			}),
		).toBe("NOT_FOUND");
	});

	it("responde NOT_FOUND si la sesión no existe", () => {
		expect(readSessionOwnerId(null)).toBeNull();
		expect(readSessionOwnerId({ token: "secreto" })).toBeNull();
		expect(
			sessionRevokeBlock({
				callerUserId: "user-a",
				currentSessionId: "sess-current",
				sessionId: "no-existe",
				sessionUserId: readSessionOwnerId(null),
			}),
		).toBe("NOT_FOUND");
	});

	it("rechaza la sesión actual del caller", () => {
		expect(
			sessionRevokeBlock({
				callerUserId: "user-a",
				currentSessionId: "sess-current",
				sessionId: "sess-current",
				sessionUserId: "user-a",
			}),
		).toBe("CURRENT_SESSION");
	});

	it("permite cerrar otra sesión propia", () => {
		expect(readSessionId("sess-current")).toBe("sess-current");
		expect(readSessionId(12)).toBeNull();
		expect(readSessionId("  ")).toBeNull();
		expect(
			sessionRevokeBlock({
				callerUserId: "user-a",
				currentSessionId: readSessionId("sess-current"),
				sessionId: "sess-otra",
				sessionUserId: "user-a",
			}),
		).toBeNull();
	});
});

describe("passkeyLabel", () => {
	it("usa el nombre, si no el autenticador, si no null", () => {
		expect(passkeyLabel("iPhone de Edzon", APPLE_AAGUID)).toBe("iPhone de Edzon");
		expect(passkeyLabel("  ", APPLE_AAGUID.toUpperCase())).toBe("Apple Passwords");
		expect(passkeyLabel(null, "00000000-0000-0000-0000-000000000000")).toBeNull();
		expect(passkeyLabel(null, "no-es-un-aaguid")).toBeNull();
	});

	it("no copia la llave pública ni el credentialID", () => {
		const passkey = toPublicPasskey({
			_id: "pk-1",
			name: null,
			aaguid: APPLE_AAGUID,
			deviceType: "singleDevice",
			backedUp: true,
			createdAt: 30,
			publicKey: "clave-publica",
			credentialID: "cred-secreto",
			counter: 4,
			transports: "internal",
		});

		expect(passkey).toEqual({
			id: "pk-1",
			name: null,
			label: "Apple Passwords",
			deviceType: "singleDevice",
			backedUp: true,
			createdAt: 30,
		});
		const encoded = JSON.stringify(passkey);
		expect(encoded).not.toContain("clave-publica");
		expect(encoded).not.toContain("cred-secreto");
	});
});

describe("securityBackup", () => {
	it("hasPassword solo si hay cuenta credential", () => {
		expect(hasCredentialProvider({ providerId: "credential", password: "hash" })).toBe(true);
		expect(hasCredentialProvider({ providerId: "passkey" })).toBe(false);
		expect(hasCredentialProvider(null)).toBe(false);
		expect(readEmailVerified({ emailVerified: true, email: "ada@correo.com" })).toBe(true);
		expect(readEmailVerified({ emailVerified: false })).toBe(false);
		expect(readEmailVerified({ emailVerified: "true" })).toBe(false);

		const backup = securityBackup(
			{ providerId: "credential", password: "hash", accessToken: "tok" },
			{ emailVerified: true, email: "ada@correo.com" },
		);
		expect(backup).toEqual({ hasPassword: true, emailVerified: true });
		const encoded = JSON.stringify(backup);
		expect(encoded).not.toContain("hash");
		expect(encoded).not.toContain("ada@correo.com");
		expect(encoded).not.toContain("tok");
	});

	it("hasPassword es false sin cuenta credential", () => {
		expect(securityBackup({ providerId: "passkey" }, { emailVerified: false })).toEqual({
			hasPassword: false,
			emailVerified: false,
		});
	});
});
