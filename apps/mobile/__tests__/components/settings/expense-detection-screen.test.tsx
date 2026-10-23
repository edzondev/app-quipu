import { act, fireEvent, render } from "@testing-library/react-native";
import { AppState, BackHandler, Clipboard, Vibration } from "react-native";
import { ExpenseDetectionScreen } from "@/shared/components/settings/expense-detection-screen";

const NOT_A_BANK = "Este link no es de un banco en Play Store. Cópialo desde la app de tu banco.";
const INTERBANK = "https://play.google.com/store/apps/details?id=pe.com.interbank.mobilebanking";
const BCP = "https://play.google.com/store/apps/details?id=com.bcp.bank.bcp";
const YAPE = "https://play.google.com/store/apps/details?id=com.bcp.innovacxion.yapeapp";
const OTHER = "https://play.google.com/store/apps/details?id=com.other.wallet";
const WHATSAPP = "https://wa.me/51999888777";

const mockGetString = jest.fn(async () => "");
const mockAddSource = jest.fn(async (_input: string) => "added");
const mockGetInstalledBanks = jest.fn(async () => [
	{ name: "Interbank APP", packageId: "pe.com.interbank.mobilebanking", installed: true },
	{ name: "Banca Móvil BCP", packageId: "com.bcp.bank.bcp", installed: true },
	{ name: "Yape", packageId: "com.bcp.innovacxion.yapeapp", installed: false },
]);
const mockGetSources = jest.fn(async () => [] as string[]);
const mockAccessEnabled = jest.fn(() => false);
const mockOpenAccess = jest.fn();
const mockPending = jest.fn(async () => []);
const mockParse = jest.fn((text: string) => {
	const match = /[?&]id=([^&#\s]+)/.exec(text);
	const id = match?.[1];
	if (!id) return { error: "invalid_link" };
	return { packageId: decodeURIComponent(id) };
});

jest.mock("@/modules/quipu-notification-listener", () => ({
	addSource: (input: string) => mockAddSource(input),
	getInstalledBanks: () => mockGetInstalledBanks(),
	getSources: () => mockGetSources(),
	isNotificationAccessEnabled: () => mockAccessEnabled(),
	openNotificationAccessSettings: () => mockOpenAccess(),
	parsePlayStoreLink: (text: string) => mockParse(text),
	getPendingNotifications: () => mockPending(),
}));

async function openScreen(onClose = jest.fn()) {
	const view = await render(<ExpenseDetectionScreen onClose={onClose} />);
	await view.findByPlaceholderText("Pega aquí el link");
	return view;
}

describe("ExpenseDetectionScreen", () => {
	beforeEach(() => {
		mockGetString.mockReset().mockResolvedValue("");
		mockAddSource.mockReset().mockResolvedValue("added");
		mockGetSources.mockReset().mockResolvedValue([]);
		mockAccessEnabled.mockReset().mockReturnValue(false);
		mockOpenAccess.mockReset();
		mockPending.mockClear();
		jest.spyOn(Clipboard, "getString").mockImplementation(() => mockGetString());
		jest.mocked(Clipboard.getString).mockClear();
		jest.spyOn(Vibration, "vibrate").mockImplementation(() => {});
		jest.mocked(Vibration.vibrate).mockClear();
	});

	it("empieza vacío, sin leer el portapapeles ni la cola de avisos", async () => {
		const view = await openScreen();
		expect(view.getByText("Conecta tu banco")).toBeTruthy();
		expect(view.getByRole("button", { name: "Siguiente" }).props.accessibilityState.disabled).toBe(
			true,
		);
		expect(mockGetString).not.toHaveBeenCalled();
		expect(mockAddSource).not.toHaveBeenCalled();
		expect(mockPending).not.toHaveBeenCalled();
		await view.unmount();
	});

	it("pegar lee el portapapeles y registra el banco del catálogo", async () => {
		mockGetString.mockResolvedValue(INTERBANK);
		const view = await openScreen();
		await act(async () => {
			fireEvent.press(view.getByRole("button", { name: "Pegar" }));
		});
		expect(mockGetString).toHaveBeenCalledTimes(1);
		expect(mockAddSource).toHaveBeenCalledWith(INTERBANK);
		expect(view.getByText("Interbank APP")).toBeTruthy();
		expect(view.getByText("IN")).toBeTruthy();
		expect(view.getByText("BANCO DETECTADO")).toBeTruthy();
		expect(view.getByText("Listo, detectamos Interbank APP.")).toBeTruthy();
		expect(view.getByRole("button", { name: "Siguiente" }).props.accessibilityState.disabled).toBe(
			false,
		);
		expect(Vibration.vibrate).toHaveBeenCalledTimes(1);
		await view.unmount();
	});

	it("escribir un link inválido avisa una vez y no registra nada", async () => {
		const view = await openScreen();
		const input = view.getByLabelText("Link de tu banco");
		await act(async () => {
			fireEvent.changeText(input, WHATSAPP);
		});
		expect(mockGetString).not.toHaveBeenCalled();
		expect(mockAddSource).not.toHaveBeenCalled();
		expect(view.getByText(NOT_A_BANK)).toBeTruthy();
		expect(view.getByRole("button", { name: "Siguiente" }).props.accessibilityState.disabled).toBe(
			true,
		);
		await act(async () => {
			fireEvent.changeText(input, `${WHATSAPP}/extra`);
		});
		expect(Vibration.vibrate).toHaveBeenCalledTimes(1);
		await view.unmount();
	});

	it("un link de Play Store que no es un banco usa el mismo aviso", async () => {
		const view = await openScreen();
		await act(async () => {
			fireEvent.changeText(view.getByLabelText("Link de tu banco"), OTHER);
		});
		expect(mockAddSource).not.toHaveBeenCalled();
		expect(view.getByText(NOT_A_BANK)).toBeTruthy();
		await view.unmount();
	});

	it("un banco del catálogo que no está instalado usa el mismo aviso y no queda en la lista", async () => {
		mockAddSource.mockResolvedValue("not_installed");
		const view = await openScreen();
		await act(async () => {
			fireEvent.changeText(view.getByLabelText("Link de tu banco"), YAPE);
		});
		expect(mockAddSource).toHaveBeenCalledWith(YAPE);
		expect(view.getByText(NOT_A_BANK)).toBeTruthy();
		expect(view.queryByText("Yape")).toBeNull();
		expect(view.getByRole("button", { name: "Siguiente" }).props.accessibilityState.disabled).toBe(
			true,
		);
		await view.unmount();
	});

	it("se pueden agregar varios bancos en la misma pantalla", async () => {
		const view = await openScreen();
		const input = view.getByLabelText("Link de tu banco");
		await act(async () => {
			fireEvent.changeText(input, INTERBANK);
		});
		await act(async () => {
			fireEvent.changeText(input, BCP);
		});
		expect(view.getByText("Interbank APP")).toBeTruthy();
		expect(view.getByText("Banca Móvil BCP")).toBeTruthy();
		expect(view.getAllByText("BANCO DETECTADO")).toHaveLength(2);
		expect(view.getByText("Listo, detectamos Banca Móvil BCP.")).toBeTruthy();
		expect(view.queryByText("Listo, detectamos Interbank APP.")).toBeNull();
		expect(mockAddSource).toHaveBeenNthCalledWith(1, INTERBANK);
		expect(mockAddSource).toHaveBeenNthCalledWith(2, BCP);
		await view.unmount();
	});

	it("un link malo no borra los bancos ya detectados", async () => {
		const view = await openScreen();
		const input = view.getByLabelText("Link de tu banco");
		await act(async () => {
			fireEvent.changeText(input, INTERBANK);
		});
		await act(async () => {
			fireEvent.changeText(input, WHATSAPP);
		});
		expect(view.getByText("Interbank APP")).toBeTruthy();
		expect(view.getByText(NOT_A_BANK)).toBeTruthy();
		expect(view.getByRole("button", { name: "Siguiente" }).props.accessibilityState.disabled).toBe(
			false,
		);
		await view.unmount();
	});

	it("pegar el mismo banco otra vez no lo duplica", async () => {
		mockGetString.mockResolvedValue(INTERBANK);
		const view = await openScreen();
		await act(async () => {
			fireEvent.press(view.getByRole("button", { name: "Pegar" }));
		});
		await act(async () => {
			fireEvent.press(view.getByRole("button", { name: "Pegar" }));
		});
		expect(view.getAllByText("Interbank APP")).toHaveLength(1);
		expect(mockAddSource).toHaveBeenCalledTimes(1);
		await view.unmount();
	});

	it("muestra los bancos que el listener ya tenía, sin volver a guardarlos", async () => {
		mockGetSources.mockResolvedValue(["pe.com.interbank.mobilebanking", "com.other.wallet"]);
		const view = await openScreen();
		expect(view.getByText("Interbank APP")).toBeTruthy();
		expect(view.queryByText("com.other.wallet")).toBeNull();
		expect(view.getByRole("button", { name: "Siguiente" }).props.accessibilityState.disabled).toBe(
			false,
		);
		expect(mockAddSource).not.toHaveBeenCalled();
		expect(Vibration.vibrate).not.toHaveBeenCalled();
		await view.unmount();
	});

	it("si el permiso ya está activo, Siguiente vuelve al origen", async () => {
		mockGetSources.mockResolvedValue(["com.bcp.bank.bcp"]);
		mockAccessEnabled.mockReturnValue(true);
		const onClose = jest.fn();
		const view = await openScreen(onClose);
		await act(async () => {
			fireEvent.press(view.getByRole("button", { name: "Siguiente" }));
		});
		expect(onClose).toHaveBeenCalledTimes(1);
		expect(view.queryByText("ÚLTIMO PASO")).toBeNull();
		expect(view.queryByText("3 DE 3")).toBeNull();
		await view.unmount();
	});

	it("Siguiente abre el permiso sin contador y Ahora no vuelve al origen", async () => {
		mockGetSources.mockResolvedValue(["com.bcp.bank.bcp"]);
		const onClose = jest.fn();
		const view = await openScreen(onClose);
		await act(async () => {
			fireEvent.press(view.getByRole("button", { name: "Siguiente" }));
		});
		expect(onClose).not.toHaveBeenCalled();
		expect(view.getByText("ÚLTIMO PASO")).toBeTruthy();
		expect(view.getByText("Dale permiso a Quipu para ver los avisos.")).toBeTruthy();
		expect(view.queryByText("3 DE 3")).toBeNull();
		expect(view.queryByText("2 DE 2")).toBeNull();
		expect(view.queryByText("1 DE 2")).toBeNull();
		await act(async () => {
			fireEvent.press(view.getByRole("button", { name: "Ir a Ajustes de Android" }));
		});
		expect(mockOpenAccess).toHaveBeenCalledTimes(1);
		await act(async () => {
			fireEvent.press(view.getByRole("button", { name: "Ahora no" }));
		});
		expect(onClose).toHaveBeenCalledTimes(1);
		await view.unmount();
	});

	it("al volver de Ajustes con el permiso activo regresa al origen", async () => {
		const listeners: Array<(state: string) => void> = [];
		jest.spyOn(AppState, "addEventListener").mockImplementation((type, listener) => {
			if (type === "change") listeners.push(listener as (state: string) => void);
			return { remove: jest.fn() };
		});
		mockGetSources.mockResolvedValue(["com.bcp.bank.bcp"]);
		const onClose = jest.fn();
		const view = await openScreen(onClose);
		await act(async () => {
			fireEvent.press(view.getByRole("button", { name: "Siguiente" }));
		});
		mockAccessEnabled.mockReturnValue(true);
		await act(async () => {
			for (const listener of listeners) listener("active");
		});
		expect(onClose).toHaveBeenCalledTimes(1);
		await view.unmount();
	});

	it("atrás del permiso regresa al link y atrás del link cierra", async () => {
		const backs: Array<() => void> = [];
		jest.spyOn(BackHandler, "addEventListener").mockImplementation((eventName, handler) => {
			if (eventName === "hardwareBackPress") {
				backs.push(() => {
					handler({ type: "hardwareBackPress", timeStamp: 0 });
				});
			}
			return { remove: () => undefined };
		});
		mockGetSources.mockResolvedValue(["com.bcp.bank.bcp"]);
		const onClose = jest.fn();
		const view = await openScreen(onClose);
		await act(async () => {
			fireEvent.press(view.getByRole("button", { name: "Siguiente" }));
		});
		await act(async () => {
			fireEvent.press(view.getByRole("button", { name: "Volver" }));
		});
		expect(view.getByText("Conecta tu banco")).toBeTruthy();
		expect(onClose).not.toHaveBeenCalled();
		await act(async () => {
			backs.at(-1)?.();
		});
		expect(onClose).toHaveBeenCalledTimes(1);
		await view.unmount();
	});
});
