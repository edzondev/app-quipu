import { act, cleanup, render } from "@testing-library/react-native";
import {
	OFFLINE_BANNER_DEBOUNCE_MS,
	OfflineBanner,
} from "@/shared/components/offline/offline-banner";

const mockConnectionState = jest.fn();

jest.mock("convex/react", () => ({
	useConvexConnectionState: () => mockConnectionState(),
}));

function connection(overrides: {
	isWebSocketConnected: boolean;
	hasEverConnected: boolean;
	connectionRetries: number;
}) {
	mockConnectionState.mockReturnValue(overrides);
}

describe("OfflineBanner", () => {
	beforeEach(() => {
		mockConnectionState.mockReset();
	});

	afterEach(() => {
		cleanup();
		jest.useRealTimers();
	});

	function useDebounceTimers() {
		jest.useFakeTimers({ doNotFake: ["nextTick", "queueMicrotask", "setImmediate"] });
	}

	async function advance(ms: number) {
		await act(async () => {
			await jest.advanceTimersByTimeAsync(ms);
		});
	}

	it("no aparece cuando el websocket está conectado", async () => {
		useDebounceTimers();
		connection({
			isWebSocketConnected: true,
			hasEverConnected: true,
			connectionRetries: 0,
		});

		const view = await render(<OfflineBanner />);
		await advance(OFFLINE_BANNER_DEBOUNCE_MS);

		expect(view.queryByText("Sin conexión")).toBeNull();
		expect(view.queryByLabelText("Sin conexión")).toBeNull();
	});

	it("aparece desconectado, después del debounce", async () => {
		useDebounceTimers();
		connection({
			isWebSocketConnected: false,
			hasEverConnected: true,
			connectionRetries: 0,
		});

		const view = await render(<OfflineBanner />);
		expect(view.queryByText("Sin conexión")).toBeNull();

		await advance(OFFLINE_BANNER_DEBOUNCE_MS - 1);
		expect(view.queryByText("Sin conexión")).toBeNull();

		await advance(1);

		expect(view.getByText("Sin conexión")).toBeTruthy();
		expect(view.getByLabelText("Sin conexión")).toBeTruthy();
		expect(view.getByLabelText("Sin conexión").props.accessibilityLiveRegion).toBe("polite");
		expect(view.queryByText(/por sincronizar/)).toBeNull();
	});

	it("aparece si el primer intento falla y nunca llegó a conectar", async () => {
		useDebounceTimers();
		connection({
			isWebSocketConnected: false,
			hasEverConnected: false,
			connectionRetries: 1,
		});

		const view = await render(<OfflineBanner />);
		await advance(OFFLINE_BANNER_DEBOUNCE_MS);

		expect(view.getByText("Sin conexión")).toBeTruthy();
	});

	it("respeta el debounce y no parpadea en una reconexión rápida", async () => {
		useDebounceTimers();
		connection({
			isWebSocketConnected: false,
			hasEverConnected: true,
			connectionRetries: 1,
		});

		const view = await render(<OfflineBanner />);
		await advance(OFFLINE_BANNER_DEBOUNCE_MS - 1);
		expect(view.queryByText("Sin conexión")).toBeNull();

		connection({
			isWebSocketConnected: true,
			hasEverConnected: true,
			connectionRetries: 1,
		});
		await act(async () => {
			view.rerender(<OfflineBanner />);
		});

		await advance(OFFLINE_BANNER_DEBOUNCE_MS);
		expect(view.queryByText("Sin conexión")).toBeNull();
	});

	it("se oculta en cuanto vuelve la conexión", async () => {
		useDebounceTimers();
		connection({
			isWebSocketConnected: false,
			hasEverConnected: true,
			connectionRetries: 0,
		});

		const view = await render(<OfflineBanner />);
		await advance(OFFLINE_BANNER_DEBOUNCE_MS);
		expect(view.getByText("Sin conexión")).toBeTruthy();

		connection({
			isWebSocketConnected: true,
			hasEverConnected: true,
			connectionRetries: 0,
		});
		await act(async () => {
			view.rerender(<OfflineBanner />);
		});

		expect(view.queryByText("Sin conexión")).toBeNull();
	});

	it("no aparece durante el primer intento de conexión", async () => {
		useDebounceTimers();
		connection({
			isWebSocketConnected: false,
			hasEverConnected: false,
			connectionRetries: 0,
		});

		const view = await render(<OfflineBanner />);
		await advance(OFFLINE_BANNER_DEBOUNCE_MS * 4);

		expect(view.queryByText("Sin conexión")).toBeNull();
	});
});
