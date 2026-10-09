import { act, fireEvent, render } from "@testing-library/react-native";
import type { ReactNode } from "react";
import OnboardingIndexScreen from "@/app/(onboarding)/index";
import { SettingsScreen } from "@/shared/components/settings/settings-screen";
import { OFFLINE_SIGN_OUT_MESSAGE } from "@/shared/lib/auth/device-session";
import type { SettingsScreenModel } from "@/shared/lib/settings/model";

const mockReplace = jest.fn();
const mockSignOut = jest.fn();
const session = {
	data: { session: { id: "sess" } } as unknown,
	error: null as unknown,
	isPending: false,
};

jest.mock("expo-router", () => ({
	useRouter: () => ({ replace: mockReplace, push: jest.fn() }),
	Redirect: () => null,
	router: { replace: mockReplace },
	useIsFocused: () => true,
}));

jest.mock("@/shared/hooks/use-profile-gate", () => ({
	useProfileGate: () => ({ isAuthReady: false, isLoading: false, profile: null }),
}));

jest.mock("@/lib/auth-client", () => ({
	authStoragePrefix: "quipu",
	authClient: {
		signOut: () => mockSignOut(),
		$store: {
			atoms: {
				session: {
					get: () => session,
					set: (next: typeof session) => {
						session.data = next.data;
						session.error = next.error;
						session.isPending = next.isPending;
					},
				},
			},
		},
	},
}));

jest.mock("expo-secure-store", () => ({
	getItemAsync: () => Promise.resolve(null),
	deleteItemAsync: () => Promise.resolve(),
}));

jest.mock("@/lib/convex", () => ({
	resetConvexClient: () => undefined,
}));

jest.mock("@expo/ui", () => {
	const { View } = require("react-native");
	return {
		BottomSheet: ({ isPresented, children }: { isPresented: boolean; children: ReactNode }) =>
			isPresented ? <View>{children}</View> : null,
		RNHostView: ({ children }: { children: ReactNode }) => <View>{children}</View>,
		ScrollView: ({ children }: { children: ReactNode }) => <View>{children}</View>,
	};
});

jest.mock("@/shared/components/ui/reicon", () => ({
	X: () => null,
	ChevronRight: () => null,
}));

const model: SettingsScreenModel = {
	initial: "E",
	name: "Edzon Perez",
	meta: "edzon@correo.com · Perú",
	passkeysLabel: "2 llaves",
	planLabel: "Gratis",
	repartoLabel: "50 / 30 / 20",
	scheduleCopy: "Mensual · día 1",
};

describe("signOut HTTP error", () => {
	it("un 5xx limpia la sesión en memoria, avisa y deja la Bienvenida", async () => {
		session.data = { session: { id: "sess" } };
		mockSignOut.mockResolvedValue({
			error: { status: 500, message: "upstream 500 raw" },
		});
		const ajustes = await render(
			<SettingsScreen
				status="ready"
				model={model}
				onClose={jest.fn()}
				onOpenSecurity={jest.fn()}
			/>,
		);
		await act(async () => {
			fireEvent.press(ajustes.getByRole("button", { name: "Cerrar sesión" }));
		});
		await act(async () => {
			fireEvent.press(ajustes.getByRole("button", { name: "Confirmar cierre de sesión" }));
		});

		expect(session.data).toBeNull();
		expect(mockReplace).toHaveBeenCalledWith("/(onboarding)");
		expect(ajustes.queryByText("upstream 500 raw")).toBeNull();
		await ajustes.unmount();

		const welcome = await render(<OnboardingIndexScreen />);
		expect(welcome.getByText("Divide tu dinero antes de gastarlo")).toBeTruthy();
		expect(welcome.getByText("Crear cuenta")).toBeTruthy();
		expect(welcome.getByText(OFFLINE_SIGN_OUT_MESSAGE)).toBeTruthy();
		expect(welcome.queryByText("upstream 500 raw")).toBeNull();
		await welcome.unmount();
	});
});
