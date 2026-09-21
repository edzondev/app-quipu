import { cleanup, render, waitFor } from "@testing-library/react";
import { useEffect } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/core/env.client", () => ({
  clientEnv: {
    NEXT_PUBLIC_APP_URL: "http://localhost:3000",
    NEXT_PUBLIC_CONVEX_URL: "https://convex.test",
    NEXT_PUBLIC_CONVEX_SITE_URL: "https://convex-site.test",
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: "1x00000000000000000000AA",
  },
}));

vi.mock("next/script", () => ({
  default: function ScriptMock({ onLoad }: { onLoad?: () => void }) {
    useEffect(() => {
      onLoad?.();
    }, [onLoad]);
    return null;
  },
}));

import { TurnstileWidget } from "./turnstile-widget";

describe("TurnstileWidget", () => {
  const renderMock = vi.fn();
  const resetMock = vi.fn();
  const removeMock = vi.fn();

  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "1x00000000000000000000AA");
    renderMock.mockReturnValue("widget-1");
    window.turnstile = {
      render: renderMock,
      reset: resetMock,
      remove: removeMock,
    };
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllEnvs();
    delete window.turnstile;
  });

  it("exposes reset that clears the token and calls turnstile.reset(widgetId)", async () => {
    const onTokenChange = vi.fn();
    const onReady = vi.fn();

    render(<TurnstileWidget onTokenChange={onTokenChange} onReady={onReady} />);

    await waitFor(() => {
      expect(renderMock).toHaveBeenCalled();
      expect(onReady).toHaveBeenCalled();
    });

    const callback = renderMock.mock.calls[0]?.[1]?.callback as
      | ((token: string) => void)
      | undefined;
    callback?.("consumed-token");
    expect(onTokenChange).toHaveBeenCalledWith("consumed-token");

    const api = onReady.mock.calls[0]?.[0] as { reset: () => void };
    api.reset();

    expect(resetMock).toHaveBeenCalledWith("widget-1");
    expect(onTokenChange).toHaveBeenCalledWith(null);
  });
});
