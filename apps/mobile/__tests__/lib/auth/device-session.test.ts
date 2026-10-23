import { nextConvexClient } from "@/lib/convex";
import {
	ACCOUNT_DELETED_MESSAGE,
	accountDeletedNotice,
	MAX_STORAGE_CHUNKS,
	OFFLINE_SIGN_OUT_MESSAGE,
	offlineSignOutNotice,
	SERVER_SIGN_OUT_WAIT_MS,
	signOutAndClearDevice,
} from "@/shared/lib/auth/device-session";

const PREFIX = "quipu";

function harness() {
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
			deleteSecure: async (key: string) => {
				log.push(`delete:${key}`);
				deleted.push(key);
			},
			resetConvex: () => {
				log.push("reset");
			},
			clearMemorySession: () => {
				log.push("memory");
			},
			clearBanks: async () => {
				log.push("banks");
			},
		},
	};
}

describe("offlineSignOutNotice", () => {
	it("usa el aviso acordado cuando Expo manda string o lista", () => {
		expect(OFFLINE_SIGN_OUT_MESSAGE).toBe(
			"Saliste de este teléfono. No pudimos avisar a Quipu, así que la sesión vencerá sola en unos días.",
		);
		expect(offlineSignOutNotice("offline")).toBe(OFFLINE_SIGN_OUT_MESSAGE);
		expect(offlineSignOutNotice(["offline"])).toBe(OFFLINE_SIGN_OUT_MESSAGE);
		expect(offlineSignOutNotice("online")).toBeNull();
		expect(offlineSignOutNotice(undefined)).toBeNull();
	});
});

describe("accountDeletedNotice", () => {
	it("usa el aviso breve cuando Expo manda string o lista", () => {
		expect(ACCOUNT_DELETED_MESSAGE).toBe("Tu cuenta fue eliminada.");
		expect(accountDeletedNotice("deleted")).toBe(ACCOUNT_DELETED_MESSAGE);
		expect(accountDeletedNotice(["deleted"])).toBe(ACCOUNT_DELETED_MESSAGE);
		expect(accountDeletedNotice("offline")).toBeNull();
		expect(accountDeletedNotice(undefined)).toBeNull();
	});
});

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
		expect(log).toContain("memory");
		expect(log).toContain("banks");
		expect(log.indexOf("banks")).toBeGreaterThan(log.indexOf("memory"));
		expect(log.indexOf("banks")).toBeLessThan(log.indexOf("reset"));
	});

	it("borra SecureStore después de que signOut se llama y termina", async () => {
		const { log, deps } = harness();
		let signOutSettled = false;
		deps.signOut = async () => {
			log.push("signOut");
			await Promise.resolve();
			signOutSettled = true;
			log.push("signOut:settled");
		};
		deps.deleteSecure = async (key: string) => {
			expect(signOutSettled).toBe(true);
			log.push(`delete:${key}`);
		};

		await signOutAndClearDevice(deps);

		expect(log.indexOf("signOut:settled")).toBeLessThan(
			log.findIndex((entry) => entry.startsWith("delete:")),
		);
	});

	it("si signOut falla, igual borra el almacenamiento y reinicia Convex", async () => {
		const { log, deleted, deps } = harness();
		deps.signOut = async () => {
			log.push("signOut");
			throw new Error("red");
		};

		const result = await signOutAndClearDevice(deps);
		expect(result).toEqual({ serverNotified: false });
		expect(log).toContain("signOut");
		expect(log.indexOf("memory")).toBeGreaterThan(log.indexOf("signOut"));
		expect(log.indexOf("memory")).toBeLessThan(log.indexOf("reset"));
		expect(deleted).toContain(`${PREFIX}_session_data`);
		expect(log.at(-1)).toBe("reset");
	});

	it("si signOut no responde, igual borra el teléfono y no espera al servidor", async () => {
		jest.useFakeTimers({ doNotFake: ["nextTick", "queueMicrotask", "setImmediate"] });
		const { log, deleted, deps } = harness();
		deps.signOut = () =>
			new Promise(() => {
				log.push("signOut");
			});

		try {
			const pending = signOutAndClearDevice(deps);
			await jest.advanceTimersByTimeAsync(SERVER_SIGN_OUT_WAIT_MS);
			const result = await pending;

			expect(result).toEqual({ serverNotified: false });
			expect(log).toContain("signOut");
			expect(log).toContain("memory");
			expect(deleted).toContain(`${PREFIX}_session_data`);
			expect(log.at(-1)).toBe("reset");
		} finally {
			jest.useRealTimers();
		}
	});

	it("si una clave no se puede borrar, sigue con el resto y reinicia Convex", async () => {
		const { deleted, log, deps } = harness();
		deps.deleteSecure = async (key: string) => {
			log.push(`delete:${key}`);
			if (key === `${PREFIX}_cookie`) throw new Error("llena");
			deleted.push(key);
		};

		await expect(signOutAndClearDevice(deps)).resolves.toEqual({ serverNotified: true });
		expect(log).toContain("memory");
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
