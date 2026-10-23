const mockClearBanks = jest.fn(async () => undefined);
const mockSession: { isPending: boolean; data: { user: { id: string } } | null } = {
	isPending: true,
	data: null,
};
const mockConvex = { isAuthenticated: false, isLoading: false };
const mockProfile: { value: { onboardingComplete: boolean } | undefined } = {
	value: undefined,
};

jest.mock("@/modules/quipu-notification-listener", () => ({
	clear: () => mockClearBanks(),
}));

jest.mock("@/lib/auth-client", () => ({
	authClient: {
		useSession: () => mockSession,
	},
}));

jest.mock("convex/react", () => ({
	useQuery: () => mockProfile.value,
	useConvexAuth: () => mockConvex,
}));

import { renderHook } from "@testing-library/react-native";
import { useProfileGate } from "@/shared/hooks/use-profile-gate";

describe("useProfileGate", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockSession.isPending = true;
		mockSession.data = null;
		mockConvex.isAuthenticated = false;
		mockConvex.isLoading = false;
		mockProfile.value = undefined;
	});

	it("borra los bancos solo cuando ya sabe que no hay sesión", async () => {
		const view = await renderHook(() => useProfileGate());
		expect(mockClearBanks).not.toHaveBeenCalled();

		mockSession.isPending = false;
		mockConvex.isAuthenticated = true;
		mockConvex.isLoading = false;
		mockProfile.value = { onboardingComplete: true };
		await view.rerender(undefined);
		expect(mockClearBanks).not.toHaveBeenCalled();

		mockSession.isPending = false;
		mockSession.data = null;
		mockConvex.isAuthenticated = false;
		mockConvex.isLoading = false;
		mockProfile.value = undefined;
		await view.rerender(undefined);
		expect(mockClearBanks).toHaveBeenCalledTimes(1);

		await view.rerender(undefined);
		expect(mockClearBanks).toHaveBeenCalledTimes(1);
	});

	it("no borra los bancos mientras queda una sesión en caché", async () => {
		mockSession.isPending = false;
		mockSession.data = { user: { id: "user" } };
		mockConvex.isAuthenticated = false;
		mockConvex.isLoading = false;
		await renderHook(() => useProfileGate());
		expect(mockClearBanks).not.toHaveBeenCalled();
	});
});
