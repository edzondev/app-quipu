const mockSignOut = jest.fn();
const mockDelete = jest.fn();
const mockReset = jest.fn();

jest.mock("@/lib/auth-client", () => ({
	authClient: {
		signOut: () => mockSignOut(),
		$store: {
			atoms: {
				session: {
					get: () => ({ data: { session: { id: "sess" } }, error: null, isPending: false }),
					set: () => undefined,
				},
			},
		},
	},
	authStoragePrefix: "quipu",
}));

jest.mock("expo-secure-store", () => ({
	deleteItemAsync: (key: string) => mockDelete(key),
}));

jest.mock("@/lib/convex", () => ({
	resetConvexClient: () => mockReset(),
}));

const mockClearBanks = jest.fn(async () => undefined);
const mockSetPaused = jest.fn(async (_paused: boolean) => undefined);

jest.mock("@/modules/quipu-notification-listener", () => ({
	clear: () => mockClearBanks(),
	setPaused: (paused: boolean) => mockSetPaused(paused),
}));

import { clearDeviceAfterAccountDeleted } from "@/lib/clear-device-after-delete";
import { signOutAndClearLocalData } from "@/lib/device-sign-out";
import { SERVER_SIGN_OUT_WAIT_MS } from "@/shared/lib/auth/device-session";

describe("signOutAndClearLocalData", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockSignOut.mockResolvedValue({ error: null });
		mockDelete.mockResolvedValue(undefined);
	});

	it("cierra con Better Auth, borra las claves quipu_ y reinicia Convex", async () => {
		await signOutAndClearLocalData();

		expect(mockSignOut).toHaveBeenCalledTimes(1);
		expect(mockDelete).toHaveBeenCalledWith("quipu_cookie");
		expect(mockDelete).toHaveBeenCalledWith("quipu_session_data");
		expect(mockReset).toHaveBeenCalledTimes(1);
		expect(mockSetPaused).toHaveBeenCalledTimes(1);
		expect(mockSetPaused).toHaveBeenCalledWith(true);
		expect(mockClearBanks).not.toHaveBeenCalled();
		const signOutOrder = mockSignOut.mock.invocationCallOrder[0] ?? 0;
		const deleteOrder = mockDelete.mock.invocationCallOrder[0] ?? 0;
		const resetOrder = mockReset.mock.invocationCallOrder[0] ?? 0;
		expect(signOutOrder).toBeLessThan(deleteOrder);
		expect(deleteOrder).toBeLessThan(resetOrder);
	});

	it("si el servidor no responde, igual borra las claves y reinicia Convex", async () => {
		jest.useFakeTimers({ doNotFake: ["nextTick", "queueMicrotask", "setImmediate"] });
		mockSignOut.mockReturnValue(new Promise(() => undefined));

		try {
			const pending = signOutAndClearLocalData();
			await jest.advanceTimersByTimeAsync(SERVER_SIGN_OUT_WAIT_MS);
			const result = await pending;

			expect(result).toEqual({ serverNotified: false });
			expect(mockDelete).toHaveBeenCalledWith("quipu_cookie");
			expect(mockDelete).toHaveBeenCalledWith("quipu_session_data");
			expect(mockReset).toHaveBeenCalledTimes(1);
			expect(mockSetPaused).toHaveBeenCalledWith(true);
			expect(mockClearBanks).not.toHaveBeenCalled();
		} finally {
			jest.useRealTimers();
		}
	});

	it("al borrar la cuenta borra los bancos y no deja la detección pausada", async () => {
		await clearDeviceAfterAccountDeleted();
		expect(mockClearBanks).toHaveBeenCalledTimes(1);
		expect(mockSetPaused).not.toHaveBeenCalled();
		expect(mockReset).toHaveBeenCalledTimes(1);
	});

	it("si pausar la detección falla, igual reinicia Convex", async () => {
		mockSetPaused.mockRejectedValueOnce(new Error("native"));
		await expect(signOutAndClearLocalData()).resolves.toEqual({ serverNotified: true });
		expect(mockReset).toHaveBeenCalledTimes(1);
	});
});
