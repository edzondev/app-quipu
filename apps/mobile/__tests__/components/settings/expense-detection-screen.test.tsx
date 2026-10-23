import { act, fireEvent, render } from "@testing-library/react-native";
import { AppState, type AppStateStatus, PermissionsAndroid, Platform } from "react-native";
import { ExpenseDetectionScreen } from "@/shared/components/settings/expense-detection-screen";

const mockGetInstalledBanks = jest.fn();
const mockGetSources = jest.fn();
const mockAddSource = jest.fn();
const mockRemoveSource = jest.fn();
const mockIsNotificationAccessEnabled = jest.fn();
const mockOpenNotificationAccessSettings = jest.fn();

jest.mock("@/modules/quipu-notification-listener", () => ({
	getInstalledBanks: () => mockGetInstalledBanks(),
	getSources: () => mockGetSources(),
	addSource: (input: string) => mockAddSource(input),
	removeSource: (packageName: string) => mockRemoveSource(packageName),
	isNotificationAccessEnabled: () => mockIsNotificationAccessEnabled(),
	openNotificationAccessSettings: () => mockOpenNotificationAccessSettings(),
}));

jest.mock("@/shared/components/ui/reicon", () => ({
	Check: () => null,
	ChevronLeft: () => null,
}));

const yape = {
	name: "Yape",
	packageId: "com.bcp.innovacxion.yapeapp",
	installed: true,
};
const bcp = {
	name: "Banca Móvil BCP",
	packageId: "com.bcp.bank.bcp",
	installed: true,
};
const interbank = {
	name: "Interbank APP",
	packageId: "pe.com.interbank.mobilebanking",
	installed: false,
};
const customId = "com.other.wallet";

let emitAppState: (state: AppStateStatus) => void = () => {};
let rendered: Awaited<ReturnType<typeof render>> | null = null;

async function openScreen(onClose = jest.fn()) {
	const view = await render(<ExpenseDetectionScreen onClose={onClose} />);
	rendered = view;
	expect(await view.findByText("¿Qué apps usas para pagar?")).toBeTruthy();
	return { view, onClose };
}

describe("ExpenseDetectionScreen", () => {
	beforeEach(() => {
		emitAppState = () => {};
		jest.spyOn(AppState, "addEventListener").mockImplementation((type, listener) => {
			if (type === "change") emitAppState = listener;
			return { remove: jest.fn() };
		});
		jest.spyOn(PermissionsAndroid, "request").mockResolvedValue(PermissionsAndroid.RESULTS.GRANTED);
		mockGetInstalledBanks.mockReset();
		mockGetSources.mockReset();
		mockAddSource.mockReset();
		mockRemoveSource.mockReset();
		mockIsNotificationAccessEnabled.mockReset();
		mockOpenNotificationAccessSettings.mockReset();
		mockGetInstalledBanks.mockResolvedValue([interbank, yape, bcp]);
		mockGetSources.mockResolvedValue([customId]);
		mockAddSource.mockResolvedValue("added");
		mockRemoveSource.mockResolvedValue(true);
		mockIsNotificationAccessEnabled.mockReturnValue(false);
	});

	afterEach(() => {
		rendered?.unmount();
		rendered = null;
		jest.useRealTimers();
		jest.restoreAllMocks();
	});

	it("lists installed banks first and toggles a source", async () => {
		const { view, onClose } = await openScreen();
		expect(view.getAllByRole("checkbox").map((node) => node.props.accessibilityLabel)).toEqual([
			yape.name,
			bcp.name,
			"Otra app",
			interbank.name,
		]);
		expect(
			view.getByRole("checkbox", { name: interbank.name }).props.accessibilityState.disabled,
		).toBe(true);
		expect(view.getByText("3 ENCONTRADAS")).toBeTruthy();

		mockAddSource.mockResolvedValueOnce("limit_reached");
		await act(async () => {
			fireEvent.press(view.getByRole("checkbox", { name: bcp.name }));
		});
		expect(mockAddSource).toHaveBeenCalledWith(bcp.packageId);
		expect(
			view.getByText("Llegaste al límite de bancos. Quita uno para agregar otro."),
		).toBeTruthy();

		await act(async () => {
			fireEvent.press(view.getByRole("checkbox", { name: yape.name }));
		});
		expect(
			view.queryByText("Llegaste al límite de bancos. Quita uno para agregar otro."),
		).toBeNull();
		expect(view.getByRole("checkbox", { name: yape.name }).props.accessibilityState.checked).toBe(
			true,
		);

		await act(async () => {
			fireEvent.press(view.getByRole("checkbox", { name: "Otra app" }));
		});
		expect(mockRemoveSource).toHaveBeenCalledWith(customId);
		expect(view.getByText("2 ENCONTRADAS")).toBeTruthy();

		await act(async () => {
			fireEvent.press(view.getByRole("checkbox", { name: interbank.name }));
		});
		expect(mockAddSource).not.toHaveBeenCalledWith(interbank.packageId);

		await act(async () => {
			fireEvent.press(view.getByRole("button", { name: "Volver" }));
		});
		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it("keeps an uninstalled selected bank removable", async () => {
		mockGetSources.mockResolvedValue([interbank.packageId, customId]);
		const { view } = await openScreen();
		const parked = view.getByRole("checkbox", { name: interbank.name });
		expect(parked.props.accessibilityState).toEqual({ checked: true, disabled: false });
		expect(view.getByText("NO INSTALADO")).toBeTruthy();
		expect(view.getByRole("button", { name: "Continuar (1)" })).toBeTruthy();

		await act(async () => {
			fireEvent.press(parked);
		});
		expect(mockRemoveSource).toHaveBeenCalledWith(interbank.packageId);
		expect(
			view.getByRole("checkbox", { name: interbank.name }).props.accessibilityState.disabled,
		).toBe(true);
	});

	it("closes from the permission step without opening Android settings", async () => {
		mockGetInstalledBanks.mockResolvedValue([yape]);
		mockGetSources.mockResolvedValue([yape.packageId]);
		const { view, onClose } = await openScreen();
		await act(async () => {
			fireEvent.press(view.getByRole("button", { name: "Continuar (1)" }));
		});
		expect(view.getByText("Dale permiso a Quipu para ver los avisos.")).toBeTruthy();
		await act(async () => {
			fireEvent.press(view.getByRole("button", { name: "Ahora no" }));
		});
		expect(onClose).toHaveBeenCalledTimes(1);
		expect(mockOpenNotificationAccessSettings).not.toHaveBeenCalled();
	});

	it("rechecks notification access and asks to post on Android 13", async () => {
		jest.useFakeTimers({ doNotFake: ["nextTick", "queueMicrotask", "setImmediate"] });
		const os = jest.replaceProperty(Platform, "OS", "android");
		const version = jest.spyOn(Platform, "Version", "get").mockReturnValue(33);
		mockGetInstalledBanks.mockResolvedValue([yape, bcp]);
		mockGetSources.mockResolvedValue([yape.packageId, bcp.packageId]);
		const { view, onClose } = await openScreen();
		expect(PermissionsAndroid.request).not.toHaveBeenCalled();
		await act(async () => {
			fireEvent.press(view.getByRole("button", { name: "Continuar (2)" }));
		});
		expect(view.getByText("2 DE 2")).toBeTruthy();
		expect(PermissionsAndroid.request).toHaveBeenCalledWith(
			PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
		);

		await act(async () => {
			fireEvent.press(view.getByRole("button", { name: "Ir a Ajustes de Android" }));
		});
		expect(mockOpenNotificationAccessSettings).toHaveBeenCalledTimes(1);
		expect(view.queryByText("AÚN NO ESTÁ ACTIVADO")).toBeNull();

		await act(async () => {
			emitAppState("active");
		});
		expect(view.getByText("AÚN NO ESTÁ ACTIVADO")).toBeTruthy();
		expect(
			view.getByText("Guardamos Yape y Banca Móvil BCP. Queda en pausa hasta que lo actives."),
		).toBeTruthy();

		mockGetInstalledBanks.mockResolvedValue([
			{ ...yape, installed: false },
			{ ...bcp, installed: false },
		]);
		mockIsNotificationAccessEnabled.mockReturnValue(false);
		await act(async () => {
			fireEvent.press(view.getByRole("button", { name: "Intentar de nuevo" }));
			emitAppState("active");
		});
		expect(view.queryByText(/Guardamos \./)).toBeNull();

		mockGetInstalledBanks.mockResolvedValue([yape, bcp]);
		mockIsNotificationAccessEnabled.mockReturnValue(true);
		await act(async () => {
			emitAppState("active");
		});
		expect(view.getByText("Permiso activado")).toBeTruthy();
		await act(async () => {
			await jest.advanceTimersByTimeAsync(599);
		});
		expect(onClose).not.toHaveBeenCalled();
		await act(async () => {
			await jest.advanceTimersByTimeAsync(1);
		});
		expect(onClose).toHaveBeenCalledTimes(1);
		os.restore();
		version.mockRestore();
	});

	it("does not say the permission is on when posting is denied", async () => {
		jest.useFakeTimers({ doNotFake: ["nextTick", "queueMicrotask", "setImmediate"] });
		const os = jest.replaceProperty(Platform, "OS", "android");
		const version = jest.spyOn(Platform, "Version", "get").mockReturnValue(33);
		jest.mocked(PermissionsAndroid.request).mockResolvedValue(PermissionsAndroid.RESULTS.DENIED);
		mockGetInstalledBanks.mockResolvedValue([yape]);
		mockGetSources.mockResolvedValue([yape.packageId]);
		mockIsNotificationAccessEnabled.mockReturnValue(true);
		const { view, onClose } = await openScreen();
		await act(async () => {
			fireEvent.press(view.getByRole("button", { name: "Continuar (1)" }));
		});
		expect(
			view.getByText(
				"Sin permiso para mostrar avisos, Quipu no te avisará cuando detecte un gasto.",
			),
		).toBeTruthy();
		expect(view.queryByText("Permiso activado")).toBeNull();
		await act(async () => {
			await jest.advanceTimersByTimeAsync(600);
		});
		expect(onClose).not.toHaveBeenCalled();
		os.restore();
		version.mockRestore();
	});
});
