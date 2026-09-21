import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useTurnstileChallenge } from "./use-turnstile-challenge";

describe("useTurnstileChallenge", () => {
  it("clears the token and calls widget reset", () => {
    const { result } = renderHook(() => useTurnstileChallenge());
    const resetWidget = vi.fn();

    act(() => {
      result.current.onTokenChange("tok");
    });
    act(() => {
      result.current.onReady({ reset: resetWidget });
    });
    act(() => {
      result.current.reset();
    });

    expect(resetWidget).toHaveBeenCalledTimes(1);
    expect(result.current.token).toBe(null);
  });
});
