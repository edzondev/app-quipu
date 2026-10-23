const mockClearPending = jest.fn(async () => undefined);
const mockSession = { isPending: true };
const mockConvex = { isAuthenticated: false, isLoading: false };
const mockProfile: { value: { onboardingComplete: boolean } | undefined } = {
	value: undefined,
};

jest.mock("@/modules/quipu-notification-listener", () => ({
	clearPendingNotifications: () => mockClearPending(),
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
		mockConvex.isAuthenticated = false;
		mockConvex.isLoading = false;
		mockProfile.value = undefined;
	});

	it("clears the listener only after the gate knows there is no session", async () => {
		const view = await renderHook(() => useProfileGate());
		expect(mockClearPending).not.toHaveBeenCalled();

		mockSession.isPending = false;
		mockConvex.isAuthenticated = true;
		mockConvex.isLoading = false;
		mockProfile.value = { onboardingComplete: true };
		await view.rerender(undefined);
		expect(mockClearPending).not.toHaveBeenCalled();

		mockSession.isPending = false;
		mockConvex.isAuthenticated = false;
		mockConvex.isLoading = false;
		mockProfile.value = undefined;
		await view.rerender(undefined);
		expect(mockClearPending).toHaveBeenCalledTimes(1);

		await view.rerender(undefined);
		expect(mockClearPending).toHaveBeenCalledTimes(1);
	});
});
