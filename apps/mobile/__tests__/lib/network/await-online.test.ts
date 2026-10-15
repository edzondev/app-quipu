import {
	ACTION_TIMEOUT_MS,
	OfflineError,
	TimeoutError,
	assertOnline,
	withTimeout,
} from "@/shared/lib/network/await-online";

const mockGetNetworkStateAsync = jest.fn();

jest.mock("expo-network", () => ({
	getNetworkStateAsync: () => mockGetNetworkStateAsync(),
}));

describe("assertOnline", () => {
	beforeEach(() => {
		mockGetNetworkStateAsync.mockReset();
	});

	it("pasa cuando el dispositivo está online", async () => {
		mockGetNetworkStateAsync.mockResolvedValue({
			isConnected: true,
			isInternetReachable: true,
		});
		await expect(assertOnline("sin red")).resolves.toBeUndefined();
	});

	it("lanza OfflineError cuando no hay red", async () => {
		mockGetNetworkStateAsync.mockResolvedValue({ isConnected: false });
		await expect(assertOnline("No se pudo guardar el compromiso.")).rejects.toEqual(
			new OfflineError("No se pudo guardar el compromiso."),
		);
	});
});

describe("withTimeout", () => {
	beforeEach(() => {
		jest.useFakeTimers({ doNotFake: ["nextTick", "queueMicrotask", "setImmediate"] });
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it("resuelve si la promesa llega a tiempo", async () => {
		const result = withTimeout(Promise.resolve("ok"), ACTION_TIMEOUT_MS, "tarde");
		await expect(result).resolves.toBe("ok");
	});

	it("rechaza con TimeoutError si se pasa el tiempo", async () => {
		const hanging = new Promise<string>(() => undefined);
		const result = withTimeout(hanging, 100, "tarde");
		const assertion = expect(result).rejects.toEqual(new TimeoutError("tarde"));
		await jest.advanceTimersByTimeAsync(100);
		await assertion;
	});
});
