import { act, fireEvent, render } from "@testing-library/react-native";
import type { ReactNode } from "react";
import OnboardingIndexScreen from "@/app/(onboarding)/index";
import { SettingsScreen } from "@/shared/components/settings/settings-screen";
import { OFFLINE_SIGN_OUT_MESSAGE } from "@/shared/lib/auth/device-session";
import type { SettingsScreenModel } from "@/shared/lib/settings/model";

const mockReplace = jest.fn();
const mockClear = jest.fn();

jest.mock("expo-router", () => ({
	useRouter: () => ({ replace: mockReplace, push: jest.fn() }),
	Redirect: () => null,
	router: { replace: mockReplace },
	useIsFocused: () => true,
}));

jest.mock("@/shared/hooks/use-profile-gate", () => ({
	useProfileGate: () => ({ isAuthReady: false, isLoading: false, profile: null }),
}));

jest.mock("@/lib/device-sign-out", () => ({
	signOutAndClearLocalData: () => mockClear(),
}));

jest.mock("@expo/ui", () => {
	const { View } = require("react-native");
	return {
		BottomSheet: ({ isPresented, children }: { isPresented: boolean; children: ReactNode }) =>
			isPresented ? <View>{children}</View> : null,
		RNHostView: ({ children }: { children: ReactNode }) => <View>{children}</View>,
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

describe("SettingsScreen", () => {
	it("muestra cuenta y sistema, y la X cierra", async () => {
		const onClose = jest.fn();
		const onOpenSecurity = jest.fn();
		const view = await render(
			<SettingsScreen
				status="ready"
				model={model}
				onClose={onClose}
				onOpenSecurity={onOpenSecurity}
			/>,
		);
		expect(view.getByText("Ajustes")).toBeTruthy();
		expect(view.getByText("E")).toBeTruthy();
		expect(view.getByText("Edzon Perez")).toBeTruthy();
		expect(view.getByText("edzon@correo.com · Perú")).toBeTruthy();
		expect(view.getByText("CUENTA")).toBeTruthy();
		expect(view.queryByText("Perfil y datos")).toBeNull();
		expect(view.getByText("Seguridad y Passkeys")).toBeTruthy();
		expect(view.getByText("2 llaves")).toBeTruthy();
		expect(view.queryByText("Plan y suscripción")).toBeNull();
		expect(view.queryByText("Gratis")).toBeNull();
		expect(view.queryByText("TU SISTEMA")).toBeNull();
		expect(view.queryByText("Reparto")).toBeNull();
		expect(view.queryByText("50 / 30 / 20")).toBeNull();
		expect(view.queryByText("Ciclo e ingresos")).toBeNull();
		expect(view.queryByText("Mensual · día 1")).toBeNull();
		expect(view.queryByText("EN ESTE TELÉFONO")).toBeNull();
		expect(view.queryByText("Automatizaciones")).toBeNull();
		expect(view.queryByText("Apariencia")).toBeNull();
		expect(view.queryByRole("button", { name: "Perfil y datos" })).toBeNull();
		expect(view.queryByRole("button", { name: "Plan y suscripción" })).toBeNull();
		expect(view.queryByRole("button", { name: "Reparto" })).toBeNull();
		expect(view.queryByRole("button", { name: "Ciclo e ingresos" })).toBeNull();

		await act(async () => {
			fireEvent.press(view.getByRole("button", { name: "Cerrar" }));
		});
		expect(onClose).toHaveBeenCalledTimes(1);
		await act(async () => {
			fireEvent.press(view.getByRole("button", { name: "Seguridad y Passkeys" }));
		});
		expect(onOpenSecurity).toHaveBeenCalledTimes(1);
		await view.unmount();
	});

	it("sin conteo de llaves la fila sigue y abre seguridad", async () => {
		const onOpenSecurity = jest.fn();
		const view = await render(
			<SettingsScreen
				status="ready"
				model={{ ...model, passkeysLabel: null }}
				onClose={jest.fn()}
				onOpenSecurity={onOpenSecurity}
			/>,
		);
		expect(view.getByText("Seguridad y Passkeys")).toBeTruthy();
		expect(view.queryByText("2 llaves")).toBeNull();
		await act(async () => {
			fireEvent.press(view.getByRole("button", { name: "Seguridad y Passkeys" }));
		});
		expect(onOpenSecurity).toHaveBeenCalledTimes(1);
	});

	it("hay una sola opción de cerrar sesión y cancelar no sale", async () => {
		const view = await render(
			<SettingsScreen
				status="ready"
				model={model}
				onClose={jest.fn()}
				onOpenSecurity={jest.fn()}
			/>,
		);
		expect(view.getAllByRole("button", { name: "Cerrar sesión" })).toHaveLength(1);
		expect(view.queryByText("Salir")).toBeNull();

		await act(async () => {
			fireEvent.press(view.getByRole("button", { name: "Cerrar sesión" }));
		});
		expect(mockClear).not.toHaveBeenCalled();
		expect(view.getByText("Vas a salir de este teléfono.")).toBeTruthy();
		expect(view.getAllByRole("button", { name: "Cerrar sesión" })).toHaveLength(1);

		await act(async () => {
			fireEvent.press(view.getByRole("button", { name: "Cancelar" }));
		});
		expect(mockClear).not.toHaveBeenCalled();
		expect(mockReplace).not.toHaveBeenCalled();
		expect(view.queryByText("Vas a salir de este teléfono.")).toBeNull();
	});

	it("confirmar cierra sesión, limpia el teléfono y va a la entrada, una sola vez", async () => {
		let release: () => void = () => undefined;
		mockClear.mockImplementation(
			() =>
				new Promise<void>((resolve) => {
					release = resolve;
				}),
		);
		const view = await render(
			<SettingsScreen
				status="ready"
				model={model}
				onClose={jest.fn()}
				onOpenSecurity={jest.fn()}
			/>,
		);

		await act(async () => {
			fireEvent.press(view.getByRole("button", { name: "Cerrar sesión" }));
		});
		const confirm = view.getByRole("button", { name: "Confirmar cierre de sesión" });
		await act(async () => {
			fireEvent.press(confirm);
		});
		expect(view.getByText("Cerrando…")).toBeTruthy();
		expect(confirm.props.accessibilityState.disabled).toBe(true);
		await act(async () => {
			fireEvent.press(confirm);
		});
		expect(mockClear).toHaveBeenCalledTimes(1);

		await act(async () => {
			release();
		});
		expect(mockReplace).toHaveBeenCalledWith("/(onboarding)");
	});

	it("si el servidor no se entera, la Bienvenida avisa en español y no muestra el error crudo", async () => {
		mockClear.mockResolvedValue({ serverNotified: false });
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
		expect(mockReplace).toHaveBeenCalledWith("/(onboarding)");
		await ajustes.unmount();

		const welcome = await render(<OnboardingIndexScreen />);
		expect(welcome.getByText("Divide tu dinero antes de gastarlo")).toBeTruthy();
		expect(welcome.getByText("Crear cuenta")).toBeTruthy();
		expect(welcome.getByText(OFFLINE_SIGN_OUT_MESSAGE)).toBeTruthy();
		expect(OFFLINE_SIGN_OUT_MESSAGE).toBe(
			"Saliste de este teléfono. No pudimos avisar a Quipu, así que la sesión vencerá sola en unos días.",
		);
		expect(welcome.queryByText(/Network request failed|token secreto/)).toBeNull();
		await welcome.unmount();
	});

	it("mientras carga sigue habiendo una sola opción de cerrar sesión", async () => {
		const view = await render(
			<SettingsScreen
				status="loading"
				model={null}
				onClose={jest.fn()}
				onOpenSecurity={jest.fn()}
			/>,
		);
		expect(view.getByText("Cargando…")).toBeTruthy();
		expect(view.getAllByRole("button", { name: "Cerrar sesión" })).toHaveLength(1);
		expect(view.queryByText("EN ESTE TELÉFONO")).toBeNull();
	});
});
