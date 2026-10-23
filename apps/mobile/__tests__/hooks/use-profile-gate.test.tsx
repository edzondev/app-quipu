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

jest.mock("../../global.css", () => ({}));

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

jest.mock("expo-splash-screen", () => ({
	setOptions: () => undefined,
	preventAutoHideAsync: async () => undefined,
	hide: () => undefined,
}));

jest.mock("expo-router", () => ({
	Stack: () => null,
}));

jest.mock("expo-status-bar", () => ({
	StatusBar: () => null,
}));

jest.mock("@/lib/convex", () => ({
	createConvexClient: () => ({}),
	nextConvexClient: () => ({}),
	registerConvexReset: () => () => undefined,
}));

jest.mock("@convex-dev/better-auth/react", () => ({
	ConvexBetterAuthProvider: ({ children }: { children: unknown }) => children,
}));

jest.mock("react-native-keyboard-controller", () => ({
	KeyboardProvider: ({ children }: { children: unknown }) => children,
}));

jest.mock("react-native-safe-area-context", () => ({
	SafeAreaProvider: ({ children }: { children: unknown }) => children,
	initialWindowMetrics: null,
}));

import { render } from "@testing-library/react-native";
import { SplashHider } from "@/app/_layout";

describe("pausa de detección", () => {
	beforeEach(() => {
		mockSetPaused.mockImplementation(async () => undefined);
		jest.clearAllMocks();
		mockSession.isPending = true;
		mockSession.data = null;
		mockConvex.isAuthenticated = false;
		mockConvex.isLoading = false;
		mockProfile.value = undefined;
	});

	it("pendiente no pausa", async () => {
		await render(<SplashHider />);
		expect(mockSetPaused).not.toHaveBeenCalled();
		expect(mockClearBanks).not.toHaveBeenCalled();
	});

	it("con sesión despausa", async () => {
		mockSession.isPending = false;
		mockSession.data = { user: { id: "user" } };
		mockConvex.isAuthenticated = true;
		mockConvex.isLoading = false;
		mockProfile.value = { onboardingComplete: true };
		await render(<SplashHider />);
		expect(mockSetPaused).toHaveBeenCalledTimes(1);
		expect(mockSetPaused).toHaveBeenCalledWith(false);
		expect(mockClearBanks).not.toHaveBeenCalled();
	});

	it("sin sesión pausa una vez", async () => {
		mockSession.isPending = false;
		mockSession.data = null;
		mockConvex.isAuthenticated = false;
		mockConvex.isLoading = false;
		await render(<SplashHider />);
		expect(mockSetPaused).toHaveBeenCalledTimes(1);
		expect(mockSetPaused).toHaveBeenCalledWith(true);
		expect(mockClearBanks).not.toHaveBeenCalled();
	});

	it("no pausa ni borra mientras queda una sesión en caché", async () => {
		mockSession.isPending = false;
		mockSession.data = { user: { id: "user" } };
		mockConvex.isAuthenticated = false;
		mockConvex.isLoading = false;
		await render(<SplashHider />);
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
		await render(<SplashHider />);
		expect(mockSetPaused).toHaveBeenCalledWith(false);
		expect(mockClearBanks).not.toHaveBeenCalled();
	});

	it("una salida vista solo mientras carga despausa al volver a entrar", async () => {
		mockSession.isPending = false;
		mockSession.data = { user: { id: "user" } };
		mockConvex.isAuthenticated = true;
		mockConvex.isLoading = false;
		mockProfile.value = { onboardingComplete: true };
		const view = await render(<SplashHider />);
		mockSetPaused.mockClear();
		mockSession.data = null;
		mockConvex.isAuthenticated = false;
		mockConvex.isLoading = true;
		mockProfile.value = undefined;
		await view.rerender(<SplashHider />);
		mockSession.data = { user: { id: "user" } };
		mockConvex.isAuthenticated = true;
		mockConvex.isLoading = false;
		mockProfile.value = { onboardingComplete: true };
		await view.rerender(<SplashHider />);
		expect(mockSetPaused.mock.calls).toEqual([[false]]);
	});

	it("un rechazo al pausar no queda sin manejar", async () => {
		const reasons: unknown[] = [];
		const onRejection = (reason: unknown) => {
			reasons.push(reason);
		};
		process.on("unhandledRejection", onRejection);
		mockSetPaused.mockImplementation(async () => {
			throw new Error("native");
		});
		mockSession.isPending = false;
		mockSession.data = null;
		mockConvex.isAuthenticated = false;
		mockConvex.isLoading = false;
		try {
			await render(<SplashHider />);
			await new Promise<void>((resolve) => {
				setImmediate(() => resolve());
			});
			expect(reasons).toHaveLength(0);
		} finally {
			process.off("unhandledRejection", onRejection);
		}
	});
});
