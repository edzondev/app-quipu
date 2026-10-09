import { act, renderHook } from "@testing-library/react-native";
import { AppState, type AppStateStatus } from "react-native";
import { useLimaDayKey } from "@/shared/hooks/use-lima-day-key";

const LIMA_LATE_NIGHT = Date.parse("2026-10-10T04:59:00.000Z");
const LIMA_NEXT_MIDNIGHT = Date.parse("2026-10-10T05:00:00.000Z");

describe("useLimaDayKey", () => {
	let emitAppState: (state: AppStateStatus) => void = () => {};
	let removeListener = jest.fn();
	let addListener: jest.SpyInstance;

	beforeEach(() => {
		jest.useFakeTimers({ now: LIMA_LATE_NIGHT });
		removeListener = jest.fn();
		addListener = jest.spyOn(AppState, "addEventListener").mockImplementation((_type, listener) => {
			emitAppState = listener;
			return { remove: removeListener };
		});
		addListener.mockClear();
	});

	afterEach(() => {
		jest.useRealTimers();
		jest.restoreAllMocks();
	});

	it("devuelve el día de Lima, no el de UTC", async () => {
		const { result } = await renderHook(() => useLimaDayKey());
		expect(result.current).toBe("2026-10-09");
	});

	it("cambia solo al llegar la medianoche de Lima", async () => {
		const { result } = await renderHook(() => useLimaDayKey());

		await act(async () => {
			jest.advanceTimersByTime(LIMA_NEXT_MIDNIGHT - LIMA_LATE_NIGHT - 1);
		});
		expect(result.current).toBe("2026-10-09");

		await act(async () => {
			jest.advanceTimersByTime(1);
		});
		expect(result.current).toBe("2026-10-10");
	});

	it("reprograma la medianoche siguiente", async () => {
		const { result } = await renderHook(() => useLimaDayKey());
		await act(async () => {
			jest.advanceTimersByTime(LIMA_NEXT_MIDNIGHT - LIMA_LATE_NIGHT);
		});
		await act(async () => {
			jest.advanceTimersByTime(24 * 60 * 60 * 1000);
		});
		expect(result.current).toBe("2026-10-11");
	});

	it("recalcula al volver a primer plano aunque el timer no haya corrido", async () => {
		const { result } = await renderHook(() => useLimaDayKey());
		jest.setSystemTime(Date.parse("2026-10-12T15:00:00.000Z"));
		await act(async () => {
			emitAppState("background");
		});
		expect(result.current).toBe("2026-10-09");
		await act(async () => {
			emitAppState("active");
		});
		expect(result.current).toBe("2026-10-12");
	});

	it("limpia el timer y el listener al desmontar", async () => {
		const setSpy = jest.spyOn(globalThis, "setTimeout");
		const clearSpy = jest.spyOn(globalThis, "clearTimeout");
		const { unmount } = await renderHook(() => useLimaDayKey());
		const midnightTimers = setSpy.mock.calls.flatMap((call, index) =>
			call[1] === LIMA_NEXT_MIDNIGHT - LIMA_LATE_NIGHT ? [setSpy.mock.results[index]?.value] : [],
		);
		expect(midnightTimers.length).toBeGreaterThan(0);

		await unmount();

		for (const timer of midnightTimers) expect(clearSpy).toHaveBeenCalledWith(timer);
		expect(removeListener).toHaveBeenCalledTimes(addListener.mock.calls.length);
	});
});
