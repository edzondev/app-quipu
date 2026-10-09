import { nextConvexClient } from "@/lib/convex";
import {
	CHUNK_MARKER,
	MAX_STORAGE_CHUNKS,
	signOutAndClearDevice,
} from "@/shared/lib/auth/device-session";

const PREFIX = "quipu";

function harness(stored: Record<string, string | null> = {}) {
	const log: string[] = [];
	const deleted: string[] = [];
	return {
		log,
		deleted,
		deps: {
			storagePrefix: PREFIX,
			signOut: async () => {
				log.push("signOut");
			},
			readSecure: async (key: string) => {
				log.push(`read:${key}`);
				return stored[key] ?? null;
			},
			deleteSecure: async (key: string) => {
				log.push(`delete:${key}`);
				deleted.push(key);
			},
			resetConvex: () => {
				log.push("reset");
			},
		},
	};
}

describe("signOutAndClearDevice", () => {
	it("cierra sesión, borra cookie y caché (con trozos) y después reinicia Convex", async () => {
		const { log, deleted, deps } = harness();

		await signOutAndClearDevice(deps);

		expect(log[0]).toBe("signOut");
		expect(log.at(-1)).toBe("reset");
		expect(log.indexOf("signOut")).toBeLessThan(
			log.findIndex((entry) => entry.startsWith("delete:")),
		);
		expect(log.findIndex((entry) => entry.startsWith("delete:"))).toBeLessThan(
			log.indexOf("reset"),
		);
		expect(deleted).toContain(`${PREFIX}_cookie`);
		expect(deleted).toContain(`${PREFIX}_session_data`);
		expect(deleted).toContain(`${PREFIX}_cookie.0`);
		expect(deleted).toContain(`${PREFIX}_session_data.${MAX_STORAGE_CHUNKS - 1}`);
		expect(deleted).not.toContain(`${PREFIX}_cookie.${MAX_STORAGE_CHUNKS}`);
	});

	it("borra todos los trozos que indica el marcador de Better Auth", async () => {
		const extra = MAX_STORAGE_CHUNKS + 4;
		const { deleted, deps } = harness({
			[`${PREFIX}_cookie`]: `${CHUNK_MARKER}${extra}`,
		});

		await signOutAndClearDevice(deps);

		expect(deleted).toContain(`${PREFIX}_cookie.${extra - 1}`);
		expect(deleted).not.toContain(`${PREFIX}_cookie.${extra}`);
	});

	it("si signOut falla, igual borra el almacenamiento y reinicia Convex", async () => {
		const { log, deleted, deps } = harness({
			[`${PREFIX}_session_data`]: "usuario",
		});
		deps.signOut = async () => {
			log.push("signOut");
			throw new Error("red");
		};

		await expect(signOutAndClearDevice(deps)).resolves.toBeUndefined();
		expect(log).toContain("signOut");
		expect(deleted).toContain(`${PREFIX}_session_data`);
		expect(log.at(-1)).toBe("reset");
	});

	it("si una clave no se puede borrar, sigue con el resto y reinicia Convex", async () => {
		const { deleted, log, deps } = harness();
		deps.deleteSecure = async (key: string) => {
			log.push(`delete:${key}`);
			if (key === `${PREFIX}_cookie`) throw new Error("llena");
			deleted.push(key);
		};

		await expect(signOutAndClearDevice(deps)).resolves.toBeUndefined();
		expect(deleted).toContain(`${PREFIX}_session_data`);
		expect(log.at(-1)).toBe("reset");
	});
});

describe("nextConvexClient", () => {
	it("cierra el cliente anterior y devuelve uno nuevo vacío", () => {
		const closed: string[] = [];
		const current = {
			id: "viejo",
			close: () => {
				closed.push("viejo");
				return Promise.resolve();
			},
		};
		const next = nextConvexClient(current, () => ({
			id: "nuevo",
			close: () => Promise.resolve(),
		}));

		expect(next.id).toBe("nuevo");
		expect(closed).toEqual(["viejo"]);
		expect(next).not.toBe(current);
	});
});
