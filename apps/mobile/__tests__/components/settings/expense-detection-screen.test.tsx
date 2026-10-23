import { act, fireEvent, render } from "@testing-library/react-native";
import { Clipboard, PermissionsAndroid, Platform, Vibration } from "react-native";
import { ExpenseDetectionScreen } from "@/shared/components/settings/expense-detection-screen";

const NOT_A_BANK = "Este link no es de un banco en Play Store. Cópialo desde la app de tu banco.";
const INTERBANK = "https://play.google.com/store/apps/details?id=pe.com.interbank.mobilebanking";
const BCP = "https://play.google.com/store/apps/details?id=com.bcp.bank.bcp";
const OTHER = "https://play.google.com/store/apps/details?id=com.other.wallet";

const mockGetString = jest.fn(async () => "");
const mockAddSource = jest.fn(async (_input: string) => "added" as const);
const mockGetInstalledBanks = jest.fn(async () => [
	{ name: "Interbank", packageId: "pe.com.interbank.mobilebanking", installed: true },
	{ name: "Banca Móvil BCP", packageId: "com.bcp.bank.bcp", installed: true },
]);
const mockGetSources = jest.fn(async () => [] as string[]);
const mockAccessEnabled = jest.fn(() => false);
const mockOpenAccess = jest.fn();
const mockParse = jest.fn((text: string) => {
	const id = /[?&]id=([^&#\s]+)/.exec(text)?.[1];
	return id ? { packageId: decodeURIComponent(id) } : { error: "invalid_link" as const };
});

jest.mock("@/modules/quipu-notification-listener", () => ({
	addSource: (input: string) => mockAddSource(input),
	getInstalledBanks: () => mockGetInstalledBanks(),
	getSources: () => mockGetSources(),
	isNotificationAccessEnabled: () => mockAccessEnabled(),
	openNotificationAccessSettings: () => mockOpenAccess(),
	parsePlayStoreLink: (text: string) => mockParse(text),
}));

async function openScreen(onClose = jest.fn()) {
	const view = await render(<ExpenseDetectionScreen onClose={onClose} />);
	await act(async () => {
		await Promise.all(mockGetInstalledBanks.mock.results.map((result) => result.value));
		await Promise.all(mockGetSources.mock.results.map((result) => result.value));
	});
	return view;
}

describe("ExpenseDetectionScreen", () => {
	beforeEach(() => {
		mockGetString.mockReset().mockResolvedValue("");
		mockAddSource.mockReset().mockResolvedValue("added");
		mockGetSources.mockReset().mockResolvedValue([]);
		mockAccessEnabled.mockReset().mockReturnValue(false);
		mockOpenAccess.mockReset();
		jest.spyOn(Clipboard, "getString").mockImplementation(() => mockGetString());
		jest.mocked(Clipboard.getString).mockClear();
		jest.spyOn(Vibration, "vibrate").mockImplementation(() => {});
		jest.mocked(Vibration.vibrate).mockClear();
	});

	it("A1 empieza vacío y Siguiente está apagado", async () => {
		const view = await openScreen();
		expect(view.getByText("Conecta tu banco")).toBeTruthy();
		expect(view.getByRole("button", { name: "Siguiente" }).props.accessibilityState.disabled).toBe(
			true,
		);
		expect(mockGetString).not.toHaveBeenCalled();
		expect(mockAddSource).not.toHaveBeenCalled();
		await view.unmount();
	});

	it("A2 muestra el banco, la marca IB y la línea verde", async () => {
		const view = await openScreen();
		await act(async () => {
			fireEvent.changeText(view.getByLabelText("Link de tu banco"), INTERBANK);
		});
		expect(view.getByText("Interbank")).toBeTruthy();
		expect(view.getByText("IB")).toBeTruthy();
		expect(view.getByText("BANCO DETECTADO")).toBeTruthy();
		expect(view.getByText("Listo, detectamos Interbank.")).toBeTruthy();
		expect(view.getByLabelText("Link de tu banco").parent?.props.className).toContain(
			"border-primary",
		);
		expect(view.getByRole("button", { name: "Siguiente" }).props.accessibilityState.disabled).toBe(
			false,
		);
		expect(Vibration.vibrate).toHaveBeenCalledWith(20);
		await view.unmount();
	});

	it("A3 avisa cuando el link no es un banco y no lo registra", async () => {
		const view = await openScreen();
		await act(async () => {
			fireEvent.changeText(view.getByLabelText("Link de tu banco"), OTHER);
		});
		expect(view.getByText(NOT_A_BANK)).toBeTruthy();
		expect(view.getByLabelText("Link de tu banco").parent?.props.className).toContain(
			"border-danger",
		);
		expect(mockAddSource).not.toHaveBeenCalled();
		expect(mockGetString).not.toHaveBeenCalled();
		await view.unmount();
	});

	it("Pegar lee el portapapeles solo al tocarlo", async () => {
		mockGetString.mockResolvedValue(INTERBANK);
		const view = await openScreen();
		expect(mockGetString).not.toHaveBeenCalled();
		await act(async () => {
			fireEvent.press(view.getByRole("button", { name: "Pegar" }));
		});
		expect(mockGetString).toHaveBeenCalledTimes(1);
		expect(mockAddSource).toHaveBeenCalledWith(INTERBANK);
		expect(view.getByText("Interbank")).toBeTruthy();
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
		expect(view.getByText("Interbank")).toBeTruthy();
		expect(view.getByText("Banca Móvil BCP")).toBeTruthy();
		expect(view.getByText("Listo, detectamos Banca Móvil BCP.")).toBeTruthy();
		expect(view.queryByText("Listo, detectamos Interbank.")).toBeNull();
		expect(mockAddSource).toHaveBeenNthCalledWith(1, INTERBANK);
		expect(mockAddSource).toHaveBeenNthCalledWith(2, BCP);
		await view.unmount();
	});

	it("Siguiente vuelve si el permiso ya está y, si no, abre los ajustes", async () => {
		mockGetSources.mockResolvedValue(["com.bcp.bank.bcp"]);
		const onClose = jest.fn();
		const view = await openScreen(onClose);
		await act(async () => {
			fireEvent.press(view.getByRole("button", { name: "Siguiente" }));
		});
		expect(mockOpenAccess).toHaveBeenCalledTimes(1);
		expect(onClose).not.toHaveBeenCalled();
		expect(view.queryByText("ÚLTIMO PASO")).toBeNull();
		expect(view.queryByText("3 DE 3")).toBeNull();
		mockAccessEnabled.mockReturnValue(true);
		await act(async () => {
			fireEvent.press(view.getByRole("button", { name: "Siguiente" }));
		});
		expect(onClose).toHaveBeenCalledTimes(1);
		await view.unmount();
	});

	it("en Android 13 Siguiente pide avisar antes de abrir los ajustes", async () => {
		const request = jest
			.spyOn(PermissionsAndroid, "request")
			.mockResolvedValue(PermissionsAndroid.RESULTS.GRANTED);
		const previous = { os: Platform.OS, version: Platform.Version };
		Object.defineProperty(Platform, "OS", { value: "android", configurable: true });
		Object.defineProperty(Platform, "Version", { value: 33, configurable: true });
		mockGetSources.mockResolvedValue(["com.bcp.bank.bcp"]);
		const view = await openScreen();
		await act(async () => {
			fireEvent.press(view.getByRole("button", { name: "Siguiente" }));
			await Promise.all(request.mock.results.map((result) => result.value));
		});
		expect(request).toHaveBeenCalledWith(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
		expect(mockOpenAccess).toHaveBeenCalledTimes(1);
		const requestedAt = request.mock.invocationCallOrder[0] ?? 0;
		const openedAt = mockOpenAccess.mock.invocationCallOrder[0] ?? 0;
		expect(requestedAt).toBeLessThan(openedAt);
		Object.defineProperty(Platform, "OS", { value: previous.os, configurable: true });
		Object.defineProperty(Platform, "Version", { value: previous.version, configurable: true });
		await view.unmount();
	});
});
