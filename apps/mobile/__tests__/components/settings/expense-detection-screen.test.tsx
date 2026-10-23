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
const mockParsePlayStoreLink = jest.fn();
const mockIsNotificationAccessEnabled = jest.fn();
const mockOpenNotificationAccessSettings = jest.fn();
const mockOpenURL = jest.fn((_url: string) => Promise.resolve());

jest.mock("@/modules/quipu-notification-listener", () => ({
	getInstalledBanks: () => mockGetInstalledBanks(),
	getSources: () => mockGetSources(),
	addSource: (input: string) => mockAddSource(input),
	removeSource: (packageName: string) => mockRemoveSource(packageName),
	parsePlayStoreLink: (text: string) => mockParsePlayStoreLink(text),
	isNotificationAccessEnabled: () => mockIsNotificationAccessEnabled(),
	openNotificationAccessSettings: () => mockOpenNotificationAccessSettings(),
}));

jest.mock("expo-linking", () => ({
	openURL: (url: string) => mockOpenURL(url),
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
const caja = {
	name: "Caja Arequipa Móvil",
	packageId: "com.cmac.cajamovilaqp",
	installed: true,
};
const banbif = {
	name: "Nueva BanBif App",
	packageId: "pe.com.banbif.pnappmobile",
	installed: false,
};
const customId = "com.other.wallet";
const cajaUrl = "https://play.google.com/store/apps/details?id=com.cmac.cajamovilaqp";

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
		jest.spyOn(Clipboard, "getString").mockResolvedValue("");
		jest.spyOn(PermissionsAndroid, "request").mockResolvedValue(PermissionsAndroid.RESULTS.GRANTED);
		mockGetInstalledBanks.mockReset();
		mockGetSources.mockReset();
		mockAddSource.mockReset();
		mockRemoveSource.mockReset();
		mockParsePlayStoreLink.mockReset();
		mockIsNotificationAccessEnabled.mockReset();
		mockOpenNotificationAccessSettings.mockReset();
		mockOpenURL.mockClear();
		mockGetInstalledBanks.mockResolvedValue([interbank, yape, bcp]);
		mockGetSources.mockResolvedValue([customId]);
		mockAddSource.mockResolvedValue("added");
		mockRemoveSource.mockResolvedValue(true);
		mockParsePlayStoreLink.mockReturnValue({ error: "invalid_link" });
		mockIsNotificationAccessEnabled.mockReturnValue(false);
	});

	afterEach(async () => {
		await rendered?.unmount();
		rendered = null;
		jest.useRealTimers();
		jest.restoreAllMocks();
	});

	it("pone primero los bancos instalados y marca o desmarca", async () => {
		const { view, onClose } = await openScreen();
		expect(view.getAllByRole("checkbox").map((node) => node.props.accessibilityLabel)).toEqual([
			yape.name,
			bcp.name,
			customId,
			interbank.name,
		]);
		expect(
			view.getByRole("checkbox", { name: interbank.name }).props.accessibilityState.disabled,
		).toBe(true);
		expect(view.getByText("NO INSTALADO")).toBeTruthy();
		expect(view.getByText("3 ENCONTRADAS")).toBeTruthy();
		expect(
			view.getByRole("button", { name: "Continuar (1)" }).props.accessibilityState.disabled,
		).toBe(false);

		mockAddSource.mockResolvedValueOnce("limit_reached");
		await act(async () => {
			fireEvent.press(view.getByRole("checkbox", { name: bcp.name }));
		});
		expect(mockAddSource).toHaveBeenCalledWith(bcp.packageId);
		expect(
			view.getByText("Llegaste al límite de bancos. Quita uno para agregar otro."),
		).toBeTruthy();
		expect(view.getByRole("button", { name: "Continuar (1)" })).toBeTruthy();

		await act(async () => {
			fireEvent.press(view.getByRole("checkbox", { name: yape.name }));
		});
		expect(mockAddSource).toHaveBeenCalledWith(yape.packageId);
		expect(
			view.queryByText("Llegaste al límite de bancos. Quita uno para agregar otro."),
		).toBeNull();
		expect(view.getByRole("button", { name: "Continuar (2)" })).toBeTruthy();

		await act(async () => {
			fireEvent.press(view.getByRole("checkbox", { name: customId }));
		});
		expect(mockRemoveSource).toHaveBeenCalledWith(customId);
		expect(view.getByText("2 ENCONTRADAS")).toBeTruthy();
		expect(view.getByRole("button", { name: "Continuar (1)" })).toBeTruthy();

		await act(async () => {
			fireEvent.press(view.getByRole("checkbox", { name: yape.name }));
		});
		expect(view.getByRole("button", { name: "Continuar" }).props.accessibilityState.disabled).toBe(
			true,
		);
		await act(async () => {
			fireEvent.press(view.getByRole("checkbox", { name: interbank.name }));
		});
		expect(mockAddSource).not.toHaveBeenCalledWith(interbank.packageId);
		expect(Clipboard.getString).not.toHaveBeenCalled();

		await act(async () => {
			fireEvent.press(view.getByRole("button", { name: "Volver" }));
		});
		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it("Pegar lee el portapapeles solo al tocarlo", async () => {
		mockGetSources.mockResolvedValue([]);
		const { view, onClose } = await openScreen();
		expect(Clipboard.getString).not.toHaveBeenCalled();
		await act(async () => {
			fireEvent.press(
				view.getByRole("button", { name: "¿No ves tu banco? Agrégalo con su enlace" }),
			);
		});
		expect(Clipboard.getString).not.toHaveBeenCalled();
		expect(view.getByText("Agrega tu banco con su enlace.")).toBeTruthy();
		expect(view.getByRole("button", { name: "Abrir Play Store" })).toBeTruthy();

		jest.mocked(Clipboard.getString).mockResolvedValueOnce("wa.me/51999888777");
		await act(async () => {
			fireEvent.press(view.getByRole("button", { name: "Pegar" }));
		});
		expect(Clipboard.getString).toHaveBeenCalledTimes(1);
		expect(mockParsePlayStoreLink).toHaveBeenCalledWith("wa.me/51999888777");
		expect(
			view.getByText("Ese enlace no es de la Play Store. Debe empezar con play.google.com."),
		).toBeTruthy();
		expect(view.getByRole("button", { name: "Agregar" }).props.accessibilityState.disabled).toBe(
			true,
		);
		expect(view.getByLabelText("ENLACE DE LA APP").props.value).toBe("wa.me/51999888777");

		await act(async () => {
			fireEvent.press(view.getByRole("button", { name: "Abrir Play Store" }));
		});
		expect(mockOpenURL).toHaveBeenCalledWith("https://play.google.com/store/apps");
		await act(async () => {
			emitAppState("active");
		});
		expect(Clipboard.getString).toHaveBeenCalledTimes(1);

		await act(async () => {
			fireEvent.press(view.getByRole("button", { name: "Volver" }));
		});
		expect(view.getByText("¿Qué apps usas para pagar?")).toBeTruthy();
		expect(onClose).not.toHaveBeenCalled();
	});

	it("reconoce un banco instalado y lo agrega al confirmar", async () => {
		mockGetInstalledBanks.mockResolvedValue([caja]);
		mockGetSources.mockResolvedValue([]);
		const { view } = await openScreen();
		await act(async () => {
			fireEvent.press(
				view.getByRole("button", { name: "¿No ves tu banco? Agrégalo con su enlace" }),
			);
		});
		mockParsePlayStoreLink.mockReturnValue({ packageId: caja.packageId });
		jest.mocked(Clipboard.getString).mockResolvedValue(cajaUrl);
		await act(async () => {
			fireEvent.press(view.getByRole("button", { name: "Pegar" }));
		});
		expect(view.getByText("¿Es la app de tu banco?")).toBeTruthy();
		expect(view.getByText("INSTALADA EN TU TELÉFONO")).toBeTruthy();
		expect(view.getByText(caja.name)).toBeTruthy();
		expect(view.queryByRole("button", { name: "Abrir Play Store" })).toBeNull();

		await act(async () => {
			fireEvent.press(view.getByRole("button", { name: "No" }));
		});
		expect(view.queryByText("¿Es la app de tu banco?")).toBeNull();
		expect(view.getByLabelText("ENLACE DE LA APP").props.value).toBe("");
		expect(mockAddSource).not.toHaveBeenCalled();

		await act(async () => {
			fireEvent.press(view.getByRole("button", { name: "Pegar" }));
		});
		mockGetSources.mockResolvedValue([caja.packageId]);
		await act(async () => {
			fireEvent.press(view.getByRole("button", { name: "Sí, agregar" }));
		});
		expect(mockAddSource).toHaveBeenCalledWith(cajaUrl);
		expect(view.getByText("¿Qué apps usas para pagar?")).toBeTruthy();
		expect(view.getByRole("checkbox", { name: caja.name }).props.accessibilityState.checked).toBe(
			true,
		);
	});

	it("avisa si la app no está instalada y la revisa al volver", async () => {
		mockGetInstalledBanks.mockResolvedValue([banbif]);
		mockGetSources.mockResolvedValue([]);
		const { view } = await openScreen();
		await act(async () => {
			fireEvent.press(
				view.getByRole("button", { name: "¿No ves tu banco? Agrégalo con su enlace" }),
			);
		});
		mockParsePlayStoreLink.mockReturnValue({ packageId: banbif.packageId });
		jest
			.mocked(Clipboard.getString)
			.mockResolvedValueOnce(`https://play.google.com/store/apps/details?id=${banbif.packageId}`);
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
		expect(await view.findByText("¿Es la app de tu banco?")).toBeTruthy();
	});

	it("pide confirmar una app que no parece un banco", async () => {
		mockGetInstalledBanks.mockResolvedValue([]);
		mockGetSources.mockResolvedValue([]);
		const { view } = await openScreen();
		await act(async () => {
			fireEvent.press(
				view.getByRole("button", { name: "¿No ves tu banco? Agrégalo con su enlace" }),
			);
		});
		const url = "https://play.google.com/store/apps/details?id=com.whatsapp";
		mockParsePlayStoreLink.mockReturnValue({ packageId: "com.whatsapp" });
		jest.mocked(Clipboard.getString).mockResolvedValueOnce(url);
		await act(async () => {
			fireEvent.press(view.getByRole("button", { name: "Pegar" }));
		});
		expect(
			view.getByText("Esa app no parece un banco. ¿Seguro que te avisa de tus gastos?"),
		).toBeTruthy();
		mockAddSource.mockResolvedValue("added_unverified");
		mockGetSources.mockResolvedValue(["com.whatsapp"]);
		await act(async () => {
			fireEvent.press(view.getByRole("button", { name: "Sí, agregar" }));
		});
		expect(mockAddSource).toHaveBeenCalledWith(url);
		expect(
			view.getByRole("checkbox", { name: "com.whatsapp" }).props.accessibilityState.checked,
		).toBe(true);
	});

	it("Ahora no cierra sin abrir el ajuste de notificaciones", async () => {
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

	it("revisa el permiso al volver y pide publicar avisos en Android 13", async () => {
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
		expect(mockOpenNotificationAccessSettings).not.toHaveBeenCalled();

		await act(async () => {
			fireEvent.press(view.getByRole("button", { name: "Ir a Ajustes de Android" }));
		});
		expect(mockOpenNotificationAccessSettings).toHaveBeenCalledTimes(1);
		expect(view.queryByText("AÚN NO ESTÁ ACTIVADO")).toBeNull();

		await act(async () => {
			emitAppState("active");
		});
		expect(view.getByText("AÚN NO ESTÁ ACTIVADO")).toBeTruthy();
		expect(view.getByText("Intentar de nuevo")).toBeTruthy();
		expect(
			view.getByText("Guardamos Yape y Banca Móvil BCP. Queda en pausa hasta que lo actives."),
		).toBeTruthy();

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
});
