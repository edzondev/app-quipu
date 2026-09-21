"use client";

import { useCallback, useRef, useState } from "react";
import type { TurnstileWidgetApi } from "@/shared/components/turnstile-widget";

export function useTurnstileChallenge() {
  const [token, setToken] = useState<string | null>(null);
  const apiRef = useRef<TurnstileWidgetApi | null>(null);

  const onReady = useCallback((api: TurnstileWidgetApi) => {
    apiRef.current = api;
  }, []);

  const reset = useCallback(() => {
    apiRef.current?.reset();
    setToken(null);
  }, []);

  return {
    token,
    onTokenChange: setToken,
    onReady,
    reset,
  };
}
