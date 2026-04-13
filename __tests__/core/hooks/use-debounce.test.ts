// __tests__/core/hooks/use-debounce.test.ts
import { renderHook, act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useDebounce } from "@/core/hooks/use-debounce";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useDebounce", () => {
  describe("basic debounce behaviour", () => {
    it("does not invoke the callback immediately on call", () => {
      const cb = vi.fn();
      const { result } = renderHook(() => useDebounce(cb, 500));

      act(() => result.current());

      expect(cb).not.toHaveBeenCalled();
    });

    it("invokes the callback after the specified delay", () => {
      const cb = vi.fn();
      const { result } = renderHook(() => useDebounce(cb, 500));

      act(() => result.current());
      act(() => vi.advanceTimersByTime(500));

      expect(cb).toHaveBeenCalledTimes(1);
    });

    it("does not invoke the callback before the delay has elapsed", () => {
      const cb = vi.fn();
      const { result } = renderHook(() => useDebounce(cb, 500));

      act(() => result.current());
      act(() => vi.advanceTimersByTime(499));

      expect(cb).not.toHaveBeenCalled();
    });

    it("passes arguments through to the callback", () => {
      const cb = vi.fn();
      const { result } = renderHook(() => useDebounce(cb, 300));

      act(() => result.current("hello", 42, true));
      act(() => vi.advanceTimersByTime(300));

      expect(cb).toHaveBeenCalledWith("hello", 42, true);
    });
  });

  describe("timer reset on rapid calls", () => {
    it("resets the timer on each call — only the last one fires", () => {
      const cb = vi.fn();
      const { result } = renderHook(() => useDebounce(cb, 300));

      act(() => {
        result.current("first");
        vi.advanceTimersByTime(200);
        result.current("second");
        vi.advanceTimersByTime(200);
        result.current("third");
        vi.advanceTimersByTime(300);
      });

      expect(cb).toHaveBeenCalledTimes(1);
      expect(cb).toHaveBeenCalledWith("third");
    });

    it("fires again after a quiet period following a previous call", () => {
      const cb = vi.fn();
      const { result } = renderHook(() => useDebounce(cb, 200));

      // First burst
      act(() => result.current("a"));
      act(() => vi.advanceTimersByTime(200));
      expect(cb).toHaveBeenCalledTimes(1);

      // Second burst after silence
      act(() => result.current("b"));
      act(() => vi.advanceTimersByTime(200));
      expect(cb).toHaveBeenCalledTimes(2);
      expect(cb).toHaveBeenLastCalledWith("b");
    });
  });

  describe("latest callback always invoked", () => {
    it("calls the newest callback even when it changed before the timer fired", () => {
      const firstCb = vi.fn();
      const secondCb = vi.fn();

      const { result, rerender } = renderHook(
        ({ cb }) => useDebounce(cb, 300),
        { initialProps: { cb: firstCb } },
      );

      // Queue a call with the first callback ...
      act(() => result.current("value"));

      // ... then replace the callback before the timer fires
      rerender({ cb: secondCb });

      act(() => vi.advanceTimersByTime(300));

      expect(firstCb).not.toHaveBeenCalled();
      expect(secondCb).toHaveBeenCalledWith("value");
    });
  });

  describe("stable function identity", () => {
    it("returns the same function reference across re-renders when delay is unchanged", () => {
      const { result, rerender } = renderHook(() => useDebounce(vi.fn(), 300));
      const first = result.current;

      rerender();

      expect(result.current).toBe(first);
    });

    it("returns a new function reference when the delay changes", () => {
      const { result, rerender } = renderHook(
        ({ delay }) => useDebounce(vi.fn(), delay),
        { initialProps: { delay: 300 } },
      );
      const first = result.current;

      rerender({ delay: 600 });

      expect(result.current).not.toBe(first);
    });

    it("uses the new delay for timers after a delay change", () => {
      const cb = vi.fn();
      const { result, rerender } = renderHook(
        ({ delay }) => useDebounce(cb, delay),
        { initialProps: { delay: 300 } },
      );

      rerender({ delay: 600 });
      act(() => result.current());

      // Should not have fired at old delay
      act(() => vi.advanceTimersByTime(300));
      expect(cb).not.toHaveBeenCalled();

      // Should fire at new delay
      act(() => vi.advanceTimersByTime(300));
      expect(cb).toHaveBeenCalledTimes(1);
    });
  });

  describe("cleanup on unmount", () => {
    it("does not invoke the callback after the component unmounts", () => {
      const cb = vi.fn();
      const { result, unmount } = renderHook(() => useDebounce(cb, 500));

      act(() => result.current());
      unmount();
      act(() => vi.advanceTimersByTime(500));

      expect(cb).not.toHaveBeenCalled();
    });

    it("cancels a pending timer when unmounted mid-wait", () => {
      const cb = vi.fn();
      const { result, unmount } = renderHook(() => useDebounce(cb, 1000));

      act(() => result.current());
      act(() => vi.advanceTimersByTime(400)); // not fired yet
      unmount();
      act(() => vi.advanceTimersByTime(600)); // would have fired here

      expect(cb).not.toHaveBeenCalled();
    });
  });

  describe("edge cases", () => {
    it("works with zero delay — callback fires on next tick", () => {
      const cb = vi.fn();
      const { result } = renderHook(() => useDebounce(cb, 0));

      act(() => result.current());
      act(() => vi.advanceTimersByTime(0));

      expect(cb).toHaveBeenCalledTimes(1);
    });

    it("handles multiple argument types correctly", () => {
      const cb = vi.fn<(a: number, b: string, c: boolean, d: null) => void>();
      const { result } = renderHook(() => useDebounce(cb, 100));

      act(() => result.current(1, "text", false, null));
      act(() => vi.advanceTimersByTime(100));

      expect(cb).toHaveBeenCalledWith(1, "text", false, null);
    });

    it("handles being called with no arguments", () => {
      const cb = vi.fn<() => void>();
      const { result } = renderHook(() => useDebounce(cb, 100));

      act(() => result.current());
      act(() => vi.advanceTimersByTime(100));

      expect(cb).toHaveBeenCalledTimes(1);
      expect(cb).toHaveBeenCalledWith();
    });
  });
});
