import { act, fireEvent, render } from "@testing-library/react-native";
import type { ReactNode } from "react";
import { SettingsScreen } from "@/shared/components/settings/settings-screen";
import type { SettingsScreenModel } from "@/shared/lib/settings/model";

const mockReplace = jest.fn();
const mockClear = jest.fn();

jest.mock("expo-router", () => ({
	useRouter: () => ({ replace: mockReplace }),
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
		expect(view.getByText("Perfil y datos")).toBeTruthy();
		expect(view.getByText("Seguridad y Passkeys")).toBeTruthy();
		expect(view.getByText("2 llaves")).toBeTruthy();
		expect(view.getByText("Plan y suscripción")).toBeTruthy();
		expect(view.getByText("Gratis")).toBeTruthy();
		expect(view.getByText("TU SISTEMA")).toBeTruthy();
		expect(view.getByText("Reparto")).toBeTruthy();
		expect(view.getByText("50 / 30 / 20")).toBeTruthy();
		expect(view.getByText("Ciclo e ingresos")).toBeTruthy();
		expect(view.getByText("Mensual · día 1")).toBeTruthy();
		expect(view.queryByText("EN ESTE TELÉFONO")).toBeNull();
		expect(view.queryByText("Automatizaciones")).toBeNull();
		expect(view.queryByText("Apariencia")).toBeNull();
		expect(view.queryByRole("button", { name: "Perfil y datos" })).toBeNull();

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
