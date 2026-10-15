import { act, cleanup, render } from "@testing-library/react-native";
import {
	OFFLINE_BANNER_DEBOUNCE_MS,
	OfflineBanner,
} from "@/shared/components/offline/offline-banner";

const mockNetworkState = jest.fn();

jest.mock("expo-network", () => ({
	useNetworkState: () => mockNetworkState(),
}));

function network(overrides: {
	isConnected?: boolean | null;
	isInternetReachable?: boolean | null;
}) {
	mockNetworkState.mockReturnValue(overrides);
}

describe("OfflineBanner", () => {
	beforeEach(() => {
		mockNetworkState.mockReset();
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

	it("no aparece cuando el dispositivo está online", async () => {
		useDebounceTimers();
		network({ isConnected: true, isInternetReachable: true });

		const view = await render(<OfflineBanner />);
		await advance(OFFLINE_BANNER_DEBOUNCE_MS);

		expect(view.queryByText("Sin conexión")).toBeNull();
		expect(view.queryByLabelText("Sin conexión")).toBeNull();
	});

	it("aparece desconectado, después del debounce", async () => {
		useDebounceTimers();
		network({ isConnected: false });

		const view = await render(<OfflineBanner />);
		expect(view.queryByText("Sin conexión")).toBeNull();

		await advance(OFFLINE_BANNER_DEBOUNCE_MS - 1);
		expect(view.queryByText("Sin conexión")).toBeNull();

		await advance(1);

		expect(view.getByText("Sin conexión")).toBeTruthy();
		expect(view.getByLabelText("Sin conexión")).toBeTruthy();
		expect(view.getByLabelText("Sin conexión").props.accessibilityLiveRegion).toBe("polite");
	});

	it("aparece si hay WiFi pero internet no es alcanzable", async () => {
		useDebounceTimers();
		network({ isConnected: true, isInternetReachable: false });

		const view = await render(<OfflineBanner />);
		await advance(OFFLINE_BANNER_DEBOUNCE_MS);

		expect(view.getByText("Sin conexión")).toBeTruthy();
	});

	it("respeta el debounce y no parpadea en una reconexión rápida", async () => {
		useDebounceTimers();
		network({ isConnected: false });

		const view = await render(<OfflineBanner />);
		await advance(OFFLINE_BANNER_DEBOUNCE_MS - 1);
		expect(view.queryByText("Sin conexión")).toBeNull();

		network({ isConnected: true, isInternetReachable: true });
		await act(async () => {
			view.rerender(<OfflineBanner />);
		});

		await advance(OFFLINE_BANNER_DEBOUNCE_MS);
		expect(view.queryByText("Sin conexión")).toBeNull();
	});

	it("se oculta en cuanto vuelve la red del dispositivo", async () => {
		useDebounceTimers();
		network({ isConnected: false });

		const view = await render(<OfflineBanner />);
		await advance(OFFLINE_BANNER_DEBOUNCE_MS);
		expect(view.getByText("Sin conexión")).toBeTruthy();

		network({ isConnected: true, isInternetReachable: true });
		await act(async () => {
			view.rerender(<OfflineBanner />);
		});

		expect(view.queryByText("Sin conexión")).toBeNull();
	});

	it("no aparece mientras el estado de red es desconocido", async () => {
		useDebounceTimers();
		network({});

		const view = await render(<OfflineBanner />);
		await advance(OFFLINE_BANNER_DEBOUNCE_MS * 4);

		expect(view.queryByText("Sin conexión")).toBeNull();
	});
});
