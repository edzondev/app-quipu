import { act, renderHook } from "@testing-library/react-native";
import { useCountdown } from "@/shared/hooks/use-countdown";

describe("useCountdown", () => {
	beforeEach(() => {
		jest.useFakeTimers();
	});
	afterEach(() => {
		jest.useRealTimers();
	});

	it("arranca con los segundos iniciales", async () => {
		const { result } = await renderHook(() => useCountdown(60));
		expect(result.current.seconds).toBe(60);
	});

	it("decrementa un segundo por intervalo", async () => {
		const { result } = await renderHook(() => useCountdown(60));
		await act(async () => {
			jest.advanceTimersByTime(1000);
		});
		expect(result.current.seconds).toBe(59);
	});

	it("llega a cero y no sigue bajando", async () => {
		const { result } = await renderHook(() => useCountdown(2));
		await act(async () => {
			jest.advanceTimersByTime(2000);
		});
		expect(result.current.seconds).toBe(0);
		await act(async () => {
			jest.advanceTimersByTime(10_000);
		});
		expect(result.current.seconds).toBe(0);
	});

	it("reset restaura los segundos iniciales", async () => {
		const { result } = await renderHook(() => useCountdown(60));
		await act(async () => {
			jest.advanceTimersByTime(10_000);
		});
		expect(result.current.seconds).toBe(50);
		await act(async () => {
			result.current.reset();
		});
		expect(result.current.seconds).toBe(60);
	});
});
