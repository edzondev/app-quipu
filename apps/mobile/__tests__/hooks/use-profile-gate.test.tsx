const mockSetPaused = jest.fn(async (_paused: boolean) => undefined);
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
	setPaused: (paused: boolean) => mockSetPaused(paused),
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

	it("pendiente no pausa", async () => {
		await renderHook(() => useProfileGate());
		expect(mockSetPaused).not.toHaveBeenCalled();
		expect(mockClearBanks).not.toHaveBeenCalled();
	});

	it("con sesión despausa", async () => {
		mockSession.isPending = false;
		mockSession.data = { user: { id: "user" } };
		mockConvex.isAuthenticated = true;
		mockConvex.isLoading = false;
		mockProfile.value = { onboardingComplete: true };
		await renderHook(() => useProfileGate());
		expect(mockSetPaused).toHaveBeenCalledTimes(1);
		expect(mockSetPaused).toHaveBeenCalledWith(false);
		expect(mockClearBanks).not.toHaveBeenCalled();
	});

	it("sin sesión pausa una vez", async () => {
		mockSession.isPending = false;
		mockSession.data = null;
		mockConvex.isAuthenticated = false;
		mockConvex.isLoading = false;
		await renderHook(() => useProfileGate());
		expect(mockSetPaused).toHaveBeenCalledTimes(1);
		expect(mockSetPaused).toHaveBeenCalledWith(true);
		expect(mockClearBanks).not.toHaveBeenCalled();
	});

	it("re-render no repite", async () => {
		mockSession.isPending = false;
		const view = await renderHook(() => useProfileGate());
		expect(mockSetPaused).toHaveBeenCalledTimes(1);
		mockConvex.isLoading = true;
		await view.rerender(undefined);
		mockConvex.isLoading = false;
		await view.rerender(undefined);
		expect(mockSetPaused).toHaveBeenCalledTimes(1);
		expect(mockClearBanks).not.toHaveBeenCalled();
	});

	it("no pausa ni borra mientras queda una sesión en caché", async () => {
		mockSession.isPending = false;
		mockSession.data = { user: { id: "user" } };
		mockConvex.isAuthenticated = false;
		mockConvex.isLoading = false;
		await renderHook(() => useProfileGate());
		expect(mockSetPaused).toHaveBeenCalledTimes(1);
		expect(mockSetPaused).toHaveBeenCalledWith(false);
		expect(mockClearBanks).not.toHaveBeenCalled();
	});

	it("con Convex listo y sin objeto de sesión despausa", async () => {
		mockSession.isPending = false;
		mockSession.data = null;
		mockConvex.isAuthenticated = true;
		mockConvex.isLoading = false;
		mockProfile.value = { onboardingComplete: true };
		await renderHook(() => useProfileGate());
		expect(mockSetPaused).toHaveBeenCalledWith(false);
		expect(mockClearBanks).not.toHaveBeenCalled();
	});
});
