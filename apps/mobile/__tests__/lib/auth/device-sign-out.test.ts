const mockSignOut = jest.fn();
const mockGet = jest.fn();
const mockDelete = jest.fn();
const mockReset = jest.fn();

jest.mock("@/lib/auth-client", () => ({
	authClient: { signOut: () => mockSignOut() },
	authStoragePrefix: "quipu",
}));

jest.mock("expo-secure-store", () => ({
	getItemAsync: (key: string) => mockGet(key),
	deleteItemAsync: (key: string) => mockDelete(key),
}));

jest.mock("@/lib/convex", () => ({
	resetConvexClient: () => mockReset(),
}));

import { signOutAndClearLocalData } from "@/lib/device-sign-out";

describe("signOutAndClearLocalData", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockSignOut.mockResolvedValue({ error: null });
		mockGet.mockResolvedValue(null);
		mockDelete.mockResolvedValue(undefined);
	});

	it("cierra con Better Auth, borra las claves quipu_ y reinicia Convex", async () => {
		await signOutAndClearLocalData();

		expect(mockSignOut).toHaveBeenCalledTimes(1);
		expect(mockGet).toHaveBeenCalledWith("quipu_cookie");
		expect(mockGet).toHaveBeenCalledWith("quipu_session_data");
		expect(mockDelete).toHaveBeenCalledWith("quipu_cookie");
		expect(mockDelete).toHaveBeenCalledWith("quipu_session_data");
		expect(mockReset).toHaveBeenCalledTimes(1);
		const signOutOrder = mockSignOut.mock.invocationCallOrder[0] ?? 0;
		const deleteOrder = mockDelete.mock.invocationCallOrder[0] ?? 0;
		const resetOrder = mockReset.mock.invocationCallOrder[0] ?? 0;
		expect(signOutOrder).toBeLessThan(deleteOrder);
		expect(deleteOrder).toBeLessThan(resetOrder);
	});
});
