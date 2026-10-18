import { act, fireEvent, render } from "@testing-library/react-native";
import type { ReactNode } from "react";
import { AppState, type AppStateStatus } from "react-native";
import OnboardingIndexScreen from "@/app/(onboarding)/index";
import { SettingsScreen } from "@/shared/components/settings/settings-screen";
import {
	ACCOUNT_DELETED_MESSAGE,
	OFFLINE_SIGN_OUT_MESSAGE,
} from "@/shared/lib/auth/device-session";
import {
	DELETE_ACCOUNT_ERROR_PASSWORD,
	DELETE_ACCOUNT_ERROR_POLAR_ACTIVE,
	DELETE_ACCOUNT_ERROR_POLAR_UNAVAILABLE,
	DELETE_ACCOUNT_PASSWORD_LABEL,
} from "@/shared/lib/settings/delete-account";
import { PLAN_SETTINGS_URL } from "@/shared/lib/settings/legal";
import type { SettingsScreenModel } from "@/shared/lib/settings/model";

const mockReplace = jest.fn();
const mockClear = jest.fn();
const mockDeleteUser = jest.fn();
const mockPasskey = jest.fn();
const mockOpenURL = jest.fn();

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

jest.mock("expo-linking", () => ({
	openURL: (...args: unknown[]) => mockOpenURL(...args),
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
const POLAR_BODY = "Tienes una suscripción activa. Cancélala desde la web.";
const POLAR_ACTIVE = {
	error: { code: "POLAR_SUBSCRIPTION_ACTIVE", message: "active raw" },
};

let emitAppState: (state: AppStateStatus) => void = () => {};

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
		mockOpenURL.mockReset();
		getNetworkStateAsync.mockReset();
		getNetworkStateAsync.mockResolvedValue({ isConnected: true, isInternetReachable: true });
		mockClear.mockResolvedValue({ serverNotified: false });
		jest.spyOn(AppState, "addEventListener").mockImplementation((_type, listener) => {
			emitAppState = listener;
			return { remove: jest.fn() };
		});
	});

	afterEach(() => {
		jest.restoreAllMocks();
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

	it("Polar activo cambia el sheet, oculta eliminar y abre la web", async () => {
		mockDeleteUser.mockResolvedValue(POLAR_ACTIVE);
		const view = await openDeleteSheet();
		await act(async () => {
			fireEvent.press(view.getByRole("button", { name: "Eliminar mi cuenta" }));
		});
		expect(view.getByText("¿Eliminar tu cuenta?")).toBeTruthy();
		expect(DELETE_ACCOUNT_ERROR_POLAR_ACTIVE).toBe(POLAR_BODY);
		expect(view.getByText(POLAR_BODY)).toBeTruthy();
		expect(
			view.queryByText(
				"Se borran para siempre tus movimientos, sobres, compromisos, ahorro y progreso. No se puede deshacer.",
			),
		).toBeNull();
		expect(view.queryByRole("button", { name: "Eliminar mi cuenta" })).toBeNull();
		expect(view.queryByText("active raw")).toBeNull();
		expect(mockClear).not.toHaveBeenCalled();
		expect(mockReplace).not.toHaveBeenCalled();

		await act(async () => {
			fireEvent.press(view.getByRole("button", { name: "Ir a la web" }));
		});
		expect(mockOpenURL).toHaveBeenCalledWith(PLAN_SETTINGS_URL);
		expect(PLAN_SETTINGS_URL).toBe("https://quipu-finance.app/settings#plan");
		expect(mockClear).not.toHaveBeenCalled();
		expect(mockReplace).not.toHaveBeenCalled();

		await act(async () => {
			fireEvent.press(view.getByRole("button", { name: "Cancelar" }));
		});
		expect(view.queryByText(POLAR_BODY)).toBeNull();
		expect(mockClear).not.toHaveBeenCalled();
		await view.unmount();
	});

	it("al volver a primer plano con Polar sigue activo mantiene el aviso", async () => {
		mockDeleteUser.mockResolvedValue(POLAR_ACTIVE);
		const view = await openDeleteSheet();
		await act(async () => {
			fireEvent.press(view.getByRole("button", { name: "Eliminar mi cuenta" }));
		});
		expect(mockDeleteUser).toHaveBeenCalledTimes(1);

		await act(async () => {
			emitAppState("background");
		});
		await act(async () => {
			emitAppState("active");
		});

		expect(mockDeleteUser).toHaveBeenCalledTimes(2);
		expect(view.getByText(POLAR_BODY)).toBeTruthy();
		expect(view.queryByRole("button", { name: "Eliminar mi cuenta" })).toBeNull();
		expect(view.getByRole("button", { name: "Ir a la web" })).toBeTruthy();
		expect(mockClear).not.toHaveBeenCalled();
		expect(mockReplace).not.toHaveBeenCalled();
		await view.unmount();
	});

	it("al volver a primer plano si Polar ya no bloquea vuelve el eliminar", async () => {
		mockDeleteUser.mockResolvedValueOnce(POLAR_ACTIVE).mockResolvedValueOnce({ error: null });
		const view = await openDeleteSheet();
		await act(async () => {
			fireEvent.press(view.getByRole("button", { name: "Eliminar mi cuenta" }));
		});
		expect(view.queryByRole("button", { name: "Eliminar mi cuenta" })).toBeNull();

		await act(async () => {
			emitAppState("active");
		});

		expect(mockDeleteUser).toHaveBeenCalledTimes(2);
		expect(view.getByRole("button", { name: "Eliminar mi cuenta" })).toBeTruthy();
		expect(view.queryByRole("button", { name: "Ir a la web" })).toBeNull();
		expect(
			view.getByText(
				"Se borran para siempre tus movimientos, sobres, compromisos, ahorro y progreso. No se puede deshacer.",
			),
		).toBeTruthy();
		expect(mockClear).not.toHaveBeenCalled();
		expect(mockReplace).not.toHaveBeenCalled();
		await view.unmount();
	});

	it("Polar no cambia el sheet si el servidor solo manda el texto", async () => {
		mockDeleteUser.mockResolvedValue({
			error: { message: "POLAR_SUBSCRIPTION_ACTIVE polar subscription is active" },
		});
		const view = await openDeleteSheet();
		await act(async () => {
			fireEvent.press(view.getByRole("button", { name: "Eliminar mi cuenta" }));
		});
		expect(view.getByRole("button", { name: "Eliminar mi cuenta" })).toBeTruthy();
		expect(view.queryByRole("button", { name: "Ir a la web" })).toBeNull();
		expect(view.getByText(ERROR)).toBeTruthy();
		expect(view.queryByText(POLAR_BODY)).toBeNull();
		await view.unmount();
	});

	it("Polar no disponible muestra el aviso, no limpia y sigue dentro", async () => {
		mockDeleteUser.mockResolvedValue({
			error: { code: "POLAR_STATUS_UNAVAILABLE", message: "status raw" },
		});
		const view = await openDeleteSheet();
		await act(async () => {
			fireEvent.press(view.getByRole("button", { name: "Eliminar mi cuenta" }));
		});
		expect(view.getByText(DELETE_ACCOUNT_ERROR_POLAR_UNAVAILABLE)).toBeTruthy();
		expect(view.queryByText("status raw")).toBeNull();
		expect(mockClear).not.toHaveBeenCalled();
		expect(mockReplace).not.toHaveBeenCalled();
		expect(view.getByText("¿Eliminar tu cuenta?")).toBeTruthy();
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
