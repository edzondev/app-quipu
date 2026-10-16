import { act, fireEvent, render } from "@testing-library/react-native";
import type { ReactNode } from "react";
import OnboardingIndexScreen from "@/app/(onboarding)/index";
import { SettingsScreen } from "@/shared/components/settings/settings-screen";
import {
	ACCOUNT_DELETED_MESSAGE,
	OFFLINE_SIGN_OUT_MESSAGE,
} from "@/shared/lib/auth/device-session";
import {
	DELETE_ACCOUNT_ERROR_PASSWORD,
	DELETE_ACCOUNT_PASSWORD_LABEL,
} from "@/shared/lib/settings/delete-account";
import type { SettingsScreenModel } from "@/shared/lib/settings/model";

const mockReplace = jest.fn();
const mockClear = jest.fn();
const mockDeleteUser = jest.fn();
const mockPasskey = jest.fn();

jest.mock("expo-router", () => ({
	useRouter: () => ({ replace: mockReplace, push: jest.fn() }),
	Redirect: () => null,
	router: { replace: mockReplace },
	useIsFocused: () => true,
	useLocalSearchParams: () => ({ notice: "deleted" }),
}));

jest.mock("@/shared/hooks/use-profile-gate", () => ({
	useProfileGate: () => ({ isAuthReady: false, isLoading: false, profile: null }),
}));

jest.mock("@/lib/device-sign-out", () => ({
	signOutAndClearLocalData: () => mockClear(),
}));

jest.mock("@/lib/auth-client", () => ({
	authStoragePrefix: "quipu",
	authClient: {
		deleteUser: (...args: unknown[]) => mockDeleteUser(...args),
		signIn: {
			passkey: (...args: unknown[]) => mockPasskey(...args),
		},
	},
}));

jest.mock("expo-network", () => ({
	getNetworkStateAsync: jest.fn(),
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
	ArrowUpRight: () => null,
}));

const { getNetworkStateAsync } = jest.requireMock("expo-network") as {
	getNetworkStateAsync: jest.Mock;
};

const model: SettingsScreenModel = {
	initial: "E",
	name: "Edzon Perez",
	meta: "edzon@correo.com · Perú",
	passkeysLabel: "2 llaves",
	planLabel: "Gratis",
	repartoLabel: "50 / 30 / 20",
	scheduleCopy: "Mensual · día 1",
	hasPassword: false,
};

const ERROR = "No pudimos eliminar tu cuenta. Intenta de nuevo.";

async function openDeleteSheet() {
	const view = await render(
		<SettingsScreen status="ready" model={model} onClose={jest.fn()} onOpenSecurity={jest.fn()} />,
	);
	await act(async () => {
		fireEvent.press(view.getByRole("button", { name: "Eliminar cuenta" }));
	});
	return view;
}

describe("Eliminar cuenta", () => {
	beforeEach(() => {
		mockReplace.mockReset();
		mockClear.mockReset();
		mockDeleteUser.mockReset();
		mockPasskey.mockReset();
		getNetworkStateAsync.mockReset();
		getNetworkStateAsync.mockResolvedValue({ isConnected: true, isInternetReachable: true });
		mockClear.mockResolvedValue({ serverNotified: false });
	});

	it("en éxito borra en el servidor, limpia el teléfono y avisa en la entrada", async () => {
		mockDeleteUser.mockResolvedValue({ error: null });
		const view = await openDeleteSheet();

		expect(view.getByText("¿Eliminar tu cuenta?")).toBeTruthy();
		expect(
			view.getByText(
				"Se borran para siempre tus movimientos, sobres, compromisos, ahorro y progreso. No se puede deshacer.",
			),
		).toBeTruthy();

		const confirm = view.getByRole("button", { name: "Eliminar mi cuenta" });
		await act(async () => {
			fireEvent.press(confirm);
		});
		expect(view.getByText("Eliminando…")).toBeTruthy();
		expect(confirm.props.accessibilityState.disabled).toBe(true);

		expect(mockDeleteUser).toHaveBeenCalledTimes(1);
		expect(mockClear).toHaveBeenCalledTimes(1);
		expect(mockReplace).toHaveBeenCalledWith({
			pathname: "/(onboarding)",
			params: { notice: "deleted" },
		});
		expect(mockReplace).not.toHaveBeenCalledWith({
			pathname: "/(onboarding)",
			params: { notice: "offline" },
		});
		await view.unmount();

		const welcome = await render(<OnboardingIndexScreen />);
		expect(welcome.getByText("Divide tu dinero antes de gastarlo")).toBeTruthy();
		expect(welcome.getByText(ACCOUNT_DELETED_MESSAGE)).toBeTruthy();
		expect(welcome.queryByText(OFFLINE_SIGN_OUT_MESSAGE)).toBeNull();
		expect(ACCOUNT_DELETED_MESSAGE).toBe("Tu cuenta fue eliminada.");
		await welcome.unmount();
	});

	it("sin red muestra el error, no llama al servidor y sigue dentro", async () => {
		getNetworkStateAsync.mockResolvedValue({ isConnected: false });
		const view = await openDeleteSheet();

		await act(async () => {
			fireEvent.press(view.getByRole("button", { name: "Eliminar mi cuenta" }));
		});

		expect(view.getByText(ERROR)).toBeTruthy();
		expect(mockDeleteUser).not.toHaveBeenCalled();
		expect(mockClear).not.toHaveBeenCalled();
		expect(mockReplace).not.toHaveBeenCalled();
		expect(view.getByText("¿Eliminar tu cuenta?")).toBeTruthy();
		await view.unmount();
	});

	it("si el servidor falla muestra el error y no cierra la sesión", async () => {
		mockDeleteUser.mockResolvedValue({
			error: { code: "FAILED", message: "upstream 500 raw" },
		});
		const view = await openDeleteSheet();

		await act(async () => {
			fireEvent.press(view.getByRole("button", { name: "Eliminar mi cuenta" }));
		});

		expect(view.getByText(ERROR)).toBeTruthy();
		expect(view.queryByText("upstream 500 raw")).toBeNull();
		expect(mockDeleteUser).toHaveBeenCalledTimes(1);
		expect(mockClear).not.toHaveBeenCalled();
		expect(mockReplace).not.toHaveBeenCalled();
		expect(view.getByRole("button", { name: "Eliminar mi cuenta" })).toBeTruthy();
		await view.unmount();
	});

	it("muestra la contraseña solo si hasPassword y la manda a deleteUser", async () => {
		const withoutPassword = await openDeleteSheet();
		expect(withoutPassword.queryByLabelText(DELETE_ACCOUNT_PASSWORD_LABEL)).toBeNull();
		await withoutPassword.unmount();

		const view = await render(
			<SettingsScreen
				status="ready"
				model={{ ...model, hasPassword: true }}
				onClose={jest.fn()}
				onOpenSecurity={jest.fn()}
			/>,
		);
		await act(async () => {
			fireEvent.press(view.getByRole("button", { name: "Eliminar cuenta" }));
		});
		const password = view.getByLabelText(DELETE_ACCOUNT_PASSWORD_LABEL);
		expect(password).toBeTruthy();
		await act(async () => {
			fireEvent.changeText(password, " secreto ");
		});
		mockDeleteUser.mockResolvedValue({
			error: { code: "INVALID_PASSWORD", message: "invalid password" },
		});
		await act(async () => {
			fireEvent.press(view.getByRole("button", { name: "Eliminar mi cuenta" }));
		});
		expect(mockDeleteUser).toHaveBeenCalledWith({ password: "secreto" });
		expect(view.getByText(DELETE_ACCOUNT_ERROR_PASSWORD)).toBeTruthy();
		expect(mockClear).not.toHaveBeenCalled();
		expect(mockReplace).not.toHaveBeenCalled();
		await view.unmount();
	});
});
