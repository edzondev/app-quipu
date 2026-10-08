import { fireEvent, render } from "@testing-library/react-native";
import { SettingsScreen } from "@/shared/components/settings/settings-screen";
import type { SettingsScreenModel } from "@/shared/lib/settings/model";

jest.mock("@/shared/components/ui/reicon", () => ({
	X: () => null,
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
		const view = await render(<SettingsScreen status="ready" model={model} onClose={onClose} />);
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

		fireEvent.press(view.getByRole("button", { name: "Cerrar" }));
		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it("oculta las llaves cuando no hay etiqueta", async () => {
		const view = await render(
			<SettingsScreen
				status="ready"
				model={{ ...model, passkeysLabel: null }}
				onClose={jest.fn()}
			/>,
		);
		expect(view.queryByText("Seguridad y Passkeys")).toBeNull();
	});
});
