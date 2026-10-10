import { act, fireEvent, render } from "@testing-library/react-native";
import type { ReactNode } from "react";
import { SecurityScreen } from "@/shared/components/settings/security-screen";
import type { SecurityScreenModel } from "@/shared/lib/settings/security-model";

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
	ChevronLeft: () => null,
	ChevronRight: () => null,
}));

const PASSKEY_ID = "pk_raw_should_not_render";
const SESSION_ID = "sess_raw_should_not_render";
const CURRENT_ID = "sess_current_raw_should_not_render";

const model: SecurityScreenModel = {
	passkeys: [
		{ id: PASSKEY_ID, name: "Llave del teléfono", createdLabel: "CREADA 3 JUN" },
		{ id: "pk-other", name: "MacBook", createdLabel: "CREADA 12 AGO" },
	],
	sessions: [
		{
			id: CURRENT_ID,
			device: "iPhone",
			activity: "ESTE DISPOSITIVO · HOY",
			isCurrent: true,
		},
		{
			id: SESSION_ID,
			device: "Chrome",
			activity: "HACE 3 DÍAS",
			isCurrent: false,
		},
	],
	passwordLabel: "Definida",
	emailLabel: "Verificado",
	emailVerified: true,
};

async function screen(overrides: Partial<Parameters<typeof SecurityScreen>[0]> = {}) {
	const onBack = jest.fn();
	const onAddPasskey = jest.fn().mockResolvedValue(undefined);
	const onDeletePasskey = jest.fn().mockResolvedValue(undefined);
	const onRevokeSession = jest.fn().mockResolvedValue(undefined);
	const onRevokeAll = jest.fn().mockResolvedValue(undefined);
	const view = await render(
		<SecurityScreen
			status="ready"
			model={model}
			onBack={onBack}
			onAddPasskey={onAddPasskey}
			onDeletePasskey={onDeletePasskey}
			onRevokeSession={onRevokeSession}
			onRevokeAll={onRevokeAll}
			{...overrides}
		/>,
	);
	return { view, onBack, onAddPasskey, onDeletePasskey, onRevokeSession, onRevokeAll };
}

describe("SecurityScreen", () => {
	it("carga y lista vacía no inventan passkeys ni sesiones", async () => {
		const loading = await screen({ status: "loading", model: null });
		expect(loading.view.getByText("Cargando…")).toBeTruthy();
		expect(loading.view.queryByText("Passkeys")).toBeNull();
		expect(loading.view.queryByText("Agregar una Passkey")).toBeNull();
		expect(loading.view.queryByText("Cerrar")).toBeNull();
		await loading.view.unmount();

		const empty = await screen({
			model: {
				...model,
				passkeys: [],
				sessions: [],
			},
		});
		expect(empty.view.getByText("Todavía no hay Passkeys.")).toBeTruthy();
		expect(empty.view.getByText("No hay sesiones activas.")).toBeTruthy();
		expect(empty.view.getByText("Agregar una Passkey")).toBeTruthy();
		expect(empty.view.queryByText("Llave del teléfono")).toBeNull();
		expect(empty.view.queryByText("Último uso")).toBeNull();
		expect(empty.view.queryByText("Lima")).toBeNull();
	});

	it("borrar pide confirmación y cancelar no borra", async () => {
		const { view, onDeletePasskey } = await screen();
		await act(async () => {
			fireEvent.press(view.getByRole("button", { name: "MacBook" }));
		});
		expect(view.getByText("Vas a quitar la llave de MacBook.")).toBeTruthy();
		expect(
			view.getByText(
				"Te quedará 1 Passkey. Si la pierdes, entrarás con tu contraseña de respaldo.",
			),
		).toBeTruthy();
		expect(view.queryByText("Último uso")).toBeNull();

		await act(async () => {
			fireEvent.press(view.getByRole("button", { name: "Cancelar" }));
		});
		expect(onDeletePasskey).not.toHaveBeenCalled();
		expect(view.queryByText("Eliminar Passkey")).toBeNull();

		await act(async () => {
			fireEvent.press(view.getByRole("button", { name: "MacBook" }));
		});
		await act(async () => {
			fireEvent.press(view.getByRole("button", { name: "Eliminar Passkey" }));
		});
		expect(onDeletePasskey).toHaveBeenCalledTimes(1);
		expect(onDeletePasskey).toHaveBeenCalledWith("pk-other");
	});

	it("avisa al borrar la última passkey", async () => {
		const { view, onDeletePasskey } = await screen({
			model: {
				...model,
				passkeys: [{ id: PASSKEY_ID, name: "Llave del teléfono", createdLabel: "CREADA 3 JUN" }],
			},
		});
		await act(async () => {
			fireEvent.press(view.getByRole("button", { name: "Llave del teléfono" }));
		});
		expect(
			view.getByText(
				"Esta es tu última Passkey. Si la borras, entrarás con tu contraseña de respaldo.",
			),
		).toBeTruthy();
		await act(async () => {
			fireEvent.press(view.getByRole("button", { name: "Cancelar" }));
		});
		expect(onDeletePasskey).not.toHaveBeenCalled();
	});

	it("la sesión actual no tiene Cerrar y cerrar otra llama a revoke", async () => {
		const { view, onRevokeSession } = await screen();
		expect(view.getByText("ESTE DISPOSITIVO · HOY")).toBeTruthy();
		expect(view.queryByRole("button", { name: "Cerrar sesión de iPhone" })).toBeNull();
		expect(view.getByRole("button", { name: "Cerrar sesión de Chrome" })).toBeTruthy();
		await act(async () => {
			fireEvent.press(view.getByRole("button", { name: "Cerrar sesión de Chrome" }));
		});
		expect(onRevokeSession).toHaveBeenCalledWith(SESSION_ID);
		expect(onRevokeSession).not.toHaveBeenCalledWith(CURRENT_ID);
	});

	it("cerrar todas pide confirmación y luego llama al handler", async () => {
		const { view, onRevokeAll } = await screen();
		await act(async () => {
			fireEvent.press(view.getByRole("button", { name: "Cerrar todas las sesiones" }));
		});
		expect(view.getByText("Vas a cerrar todas las sesiones.")).toBeTruthy();
		await act(async () => {
			fireEvent.press(view.getByRole("button", { name: "Cancelar" }));
		});
		expect(onRevokeAll).not.toHaveBeenCalled();

		await act(async () => {
			fireEvent.press(view.getByRole("button", { name: "Cerrar todas las sesiones" }));
		});
		await act(async () => {
			fireEvent.press(view.getByRole("button", { name: "Cerrar todas" }));
		});
		expect(onRevokeAll).toHaveBeenCalledTimes(1);
	});

	it("contraseña y correo de recuperación son estado, no botones", async () => {
		const { view } = await screen();
		expect(view.getByText("Contraseña")).toBeTruthy();
		expect(view.getByText("Definida")).toBeTruthy();
		expect(view.getByText("Correo de recuperación")).toBeTruthy();
		expect(view.getByText("Verificado")).toBeTruthy();
		expect(view.queryByRole("button", { name: "Contraseña" })).toBeNull();
		expect(view.queryByRole("button", { name: "Correo de recuperación" })).toBeNull();

		for (const label of ["Contraseña", "Correo de recuperación"]) {
			let node = view.getByText(label).parent;
			while (node) {
				expect(node.props.accessibilityRole).not.toBe("button");
				const className = node.props.className;
				if (typeof className === "string") {
					expect(className).not.toContain("active:opacity");
				}
				node = node.parent;
			}
		}
	});

	it("no muestra ids crudos ni datos que no existen", async () => {
		const { view } = await screen();
		const tree = JSON.stringify(view.toJSON());
		expect(tree).not.toContain(PASSKEY_ID);
		expect(tree).not.toContain(SESSION_ID);
		expect(tree).not.toContain(CURRENT_ID);
		expect(tree).not.toContain("Lima");
		expect(tree).not.toContain("Último uso");
		expect(view.getByText("Definida")).toBeTruthy();
		expect(view.getByText("Verificado")).toBeTruthy();
	});

	it("oculta passkeys y sesiones cuando la fuente no está", async () => {
		const { view } = await screen({
			model: { ...model, passkeys: null, sessions: null },
		});
		expect(view.getAllByText("No disponible")).toHaveLength(2);
		expect(view.queryByText("Agregar una Passkey")).toBeNull();
		expect(view.queryByText("Cerrar todas las sesiones")).toBeNull();
		expect(view.queryByText("Llave del teléfono")).toBeNull();
		expect(view.queryByRole("button", { name: "Cerrar sesión de Chrome" })).toBeNull();
	});
});
