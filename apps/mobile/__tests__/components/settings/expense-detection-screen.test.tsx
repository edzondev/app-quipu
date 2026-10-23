import { act, fireEvent, render } from "@testing-library/react-native";
import {
	AppState,
	type AppStateStatus,
	Clipboard,
	PermissionsAndroid,
	Platform,
} from "react-native";
import { ExpenseDetectionScreen } from "@/shared/components/settings/expense-detection-screen";

const mockGetInstalledBanks = jest.fn();
const mockGetSources = jest.fn();
const mockAddSource = jest.fn();
const mockRemoveSource = jest.fn();
const mockIsNotificationAccessEnabled = jest.fn();
const mockOpenNotificationAccessSettings = jest.fn();
const mockParsePlayStoreLink = jest.fn();
const mockOpenURL = jest.fn();

jest.mock("@/modules/quipu-notification-listener", () => ({
	getInstalledBanks: () => mockGetInstalledBanks(),
	getSources: () => mockGetSources(),
	addSource: (input: string) => mockAddSource(input),
	removeSource: (packageName: string) => mockRemoveSource(packageName),
	isNotificationAccessEnabled: () => mockIsNotificationAccessEnabled(),
	openNotificationAccessSettings: () => mockOpenNotificationAccessSettings(),
	parsePlayStoreLink: (text: string) => mockParsePlayStoreLink(text),
}));

jest.mock("expo-linking", () => ({
	openURL: (...args: unknown[]) => mockOpenURL(...args),
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
		mockParsePlayStoreLink.mockReset();
		mockOpenURL.mockReset();
		mockParsePlayStoreLink.mockReturnValue({ error: "invalid_link" });
		mockOpenURL.mockResolvedValue(undefined);
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
		expect(view.getByText("Permiso activado").props.accessibilityLiveRegion).toBe("polite");
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

	it("reads the clipboard only when Pegar is pressed", async () => {
		const getString = jest.spyOn(Clipboard, "getString").mockResolvedValue("wa.me/51999888777");
		const { view, onClose } = await openScreen();
		expect(getString).not.toHaveBeenCalled();
		await act(async () => {
			fireEvent.press(
				view.getByRole("button", { name: "¿No ves tu banco? Agrégalo con su enlace" }),
			);
		});
		expect(view.getByText("Agrega tu banco con su enlace.")).toBeTruthy();
		expect(getString).not.toHaveBeenCalled();
		await act(async () => {
			fireEvent.press(view.getByRole("button", { name: "Abrir Play Store" }));
		});
		expect(mockOpenURL).toHaveBeenCalledWith("https://play.google.com/store/apps");
		await act(async () => {
			fireEvent.press(view.getByRole("button", { name: "Pegar" }));
		});
		expect(getString).toHaveBeenCalledTimes(1);
		expect(view.getByLabelText("ENLACE DE LA APP").props.value).toBe("wa.me/51999888777");
		expect(
			view.getByText("Ese enlace no es de la Play Store. Debe empezar con play.google.com."),
		).toBeTruthy();
		expect(view.getByRole("button", { name: "Agregar" }).props.accessibilityState.disabled).toBe(
			true,
		);
		await act(async () => {
			emitAppState("active");
		});
		expect(getString).toHaveBeenCalledTimes(1);
		await act(async () => {
			fireEvent.press(view.getByRole("button", { name: "Volver" }));
		});
		expect(view.getByText("¿Qué apps usas para pagar?")).toBeTruthy();
		expect(onClose).not.toHaveBeenCalled();
	});

	it("confirms an installed catalog app from a pasted Play Store link", async () => {
		const caja = {
			name: "Caja Arequipa Móvil",
			packageId: "com.cmac.cajamovilaqp",
			installed: true,
			icon: "aWNvbg==",
		};
		const url = "https://play.google.com/store/apps/details?id=com.cmac.cajamovilaqp";
		mockGetInstalledBanks.mockResolvedValue([caja]);
		mockGetSources.mockResolvedValue([]);
		mockParsePlayStoreLink.mockReturnValue({ packageId: caja.packageId });
		jest.spyOn(Clipboard, "getString").mockResolvedValue(url);
		const { view } = await openScreen();
		await act(async () => {
			fireEvent.press(
				view.getByRole("button", { name: "¿No ves tu banco? Agrégalo con su enlace" }),
			);
		});
		await act(async () => {
			fireEvent.press(view.getByRole("button", { name: "Pegar" }));
		});
		expect(view.getByText("¿Es la app de tu banco?")).toBeTruthy();
		expect(view.getByText("APP ENCONTRADA")).toBeTruthy();
		expect(view.queryByText("Toca «Abrir Play Store» y busca la app de tu banco.")).toBeNull();
		await act(async () => {
			fireEvent.press(view.getByRole("button", { name: "No" }));
		});
		expect(view.queryByText("¿Es la app de tu banco?")).toBeNull();
		expect(mockAddSource).not.toHaveBeenCalled();
		mockGetSources.mockResolvedValue([caja.packageId]);
		await act(async () => {
			fireEvent.press(view.getByRole("button", { name: "Pegar" }));
		});
		await act(async () => {
			fireEvent.press(view.getByRole("button", { name: "Sí, agregar" }));
		});
		expect(mockAddSource).toHaveBeenCalledWith(url);
		expect(view.getByRole("checkbox", { name: caja.name }).props.accessibilityState.checked).toBe(
			true,
		);
	});

	it("asks to install a catalog bank that is not on the phone", async () => {
		const banbif = {
			name: "Nueva BanBif App",
			packageId: "pe.com.banbif.pnappmobile",
			installed: false,
		};
		const url = `https://play.google.com/store/apps/details?id=${banbif.packageId}`;
		mockGetInstalledBanks.mockResolvedValue([banbif]);
		mockGetSources.mockResolvedValue([]);
		mockParsePlayStoreLink.mockReturnValue({ packageId: banbif.packageId });
		jest.spyOn(Clipboard, "getString").mockResolvedValue(url);
		const { view } = await openScreen();
		await act(async () => {
			fireEvent.press(
				view.getByRole("button", { name: "¿No ves tu banco? Agrégalo con su enlace" }),
			);
		});
		await act(async () => {
			fireEvent.press(view.getByRole("button", { name: "Pegar" }));
		});
		expect(
			view.getByText(
				"Esa app no está en tu teléfono. Instálala primero para que Quipu pueda leer sus avisos.",
			),
		).toBeTruthy();
		await act(async () => {
			fireEvent.press(view.getByRole("button", { name: "Abrir en Play Store" }));
		});
		expect(mockOpenURL).toHaveBeenCalledWith(
			`https://play.google.com/store/apps/details?id=${banbif.packageId}`,
		);
		expect(mockAddSource).not.toHaveBeenCalled();
		mockGetInstalledBanks.mockResolvedValue([{ ...banbif, installed: true }]);
		await act(async () => {
			emitAppState("active");
		});
		expect(view.getByText("¿Es la app de tu banco?")).toBeTruthy();
	});

	it("labels an app outside the catalog as Otra app", async () => {
		const url = "https://play.google.com/store/apps/details?id=com.whatsapp";
		mockGetInstalledBanks.mockResolvedValue([yape]);
		mockGetSources.mockResolvedValue([]);
		mockParsePlayStoreLink.mockReturnValue({ packageId: "com.whatsapp" });
		mockAddSource.mockResolvedValue("added_unverified");
		jest.spyOn(Clipboard, "getString").mockResolvedValue(url);
		const { view } = await openScreen();
		await act(async () => {
			fireEvent.press(
				view.getByRole("button", { name: "¿No ves tu banco? Agrégalo con su enlace" }),
			);
		});
		await act(async () => {
			fireEvent.press(view.getByRole("button", { name: "Pegar" }));
		});
		expect(view.getByText("Otra app")).toBeTruthy();
		expect(view.queryByText("com.whatsapp")).toBeNull();
		expect(
			view.getByText("Esa app no parece un banco. ¿Seguro que te avisa de tus gastos?"),
		).toBeTruthy();
		mockGetSources.mockResolvedValue(["com.whatsapp"]);
		await act(async () => {
			fireEvent.press(view.getByRole("button", { name: "Sí, agregar" }));
		});
		expect(mockAddSource).toHaveBeenCalledWith(url);
		expect(view.getByRole("checkbox", { name: "Otra app" }).props.accessibilityState.checked).toBe(
			true,
		);
		expect(view.queryByText("com.whatsapp")).toBeNull();
	});
});
