import { act, fireEvent, render } from "@testing-library/react-native";
import { SettingsScreen } from "@/shared/components/settings/settings-screen";
import type { SettingsScreenModel } from "@/shared/lib/settings/model";

const mockReplace = jest.fn();
const mockSignOut = jest.fn();

jest.mock("expo-router", () => ({
	useRouter: () => ({ replace: mockReplace }),
}));

jest.mock("@/lib/auth-client", () => ({
	authClient: {
		signOut: () => mockSignOut(),
	},
}));

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

	it("cerrar sesión llama a signOut, va a /sign-in y no acepta un segundo toque", async () => {
		let release: () => void = () => undefined;
		mockSignOut.mockImplementation(
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
		const button = view.getByRole("button", { name: "Cerrar sesión" });
		expect(button.props.accessibilityState.disabled).toBe(true);
		await act(async () => {
			fireEvent.press(button);
		});
		expect(mockSignOut).toHaveBeenCalledTimes(1);

		await act(async () => {
			release();
		});
		expect(mockReplace).toHaveBeenCalledWith("/sign-in");
	});
});
