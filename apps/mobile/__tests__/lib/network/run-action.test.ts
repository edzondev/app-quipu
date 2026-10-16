import { ACTION_TIMEOUT_MS, OfflineError, TimeoutError } from "@/shared/lib/network/await-online";
import { runAction } from "@/shared/lib/network/run-action";

jest.mock("expo-network", () => ({
	getNetworkStateAsync: jest.fn(),
}));

const { getNetworkStateAsync } = jest.requireMock("expo-network") as {
	getNetworkStateAsync: jest.Mock;
};

describe("runAction", () => {
	beforeEach(() => {
		getNetworkStateAsync.mockReset();
	});

	it("corre el trabajo cuando hay red", async () => {
		getNetworkStateAsync.mockResolvedValue({ isConnected: true, isInternetReachable: true });
		await expect(runAction(async () => "ok", "falló")).resolves.toBe("ok");
	});

	it("falla offline con el mensaje dado", async () => {
		getNetworkStateAsync.mockResolvedValue({ isConnected: false });
		await expect(runAction(async () => "ok", "sin red")).rejects.toEqual(
			new OfflineError("sin red"),
		);
	});

	it("falla por timeout con el mensaje dado", async () => {
		getNetworkStateAsync.mockResolvedValue({ isConnected: true, isInternetReachable: true });
		jest.useFakeTimers();
		const pending = runAction(() => new Promise(() => {}), "tarde");
		const expectation = expect(pending).rejects.toEqual(new TimeoutError("tarde"));
		await jest.advanceTimersByTimeAsync(ACTION_TIMEOUT_MS);
		await expectation;
		jest.useRealTimers();
	});
});
