"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import { clientEnv } from "@/core/env.client";
import { isTurnstileEnabled } from "@/lib/turnstile/config";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback?: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
        },
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
  }
}

export type TurnstileWidgetApi = {
  reset: () => void;
};

type TurnstileWidgetProps = {
  onTokenChange: (token: string | null) => void;
  onReady?: (api: TurnstileWidgetApi) => void;
  className?: string;
};

export function TurnstileWidget({
  onTokenChange,
  onReady,
  className,
}: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const onTokenChangeRef = useRef(onTokenChange);
  const onReadyRef = useRef(onReady);
  const [scriptReady, setScriptReady] = useState(false);
  const siteKey = clientEnv.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    onTokenChangeRef.current = onTokenChange;
  }, [onTokenChange]);

  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  useEffect(() => {
    if (window.turnstile) setScriptReady(true);
  }, []);

  useEffect(() => {
    if (
      !scriptReady ||
      !siteKey ||
      !containerRef.current ||
      !window.turnstile
    ) {
      return;
    }

    if (widgetIdRef.current) {
      window.turnstile.remove(widgetIdRef.current);
      widgetIdRef.current = null;
    }

    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      theme: "auto",
      callback: (token) => onTokenChangeRef.current(token),
      "expired-callback": () => onTokenChangeRef.current(null),
      "error-callback": () => onTokenChangeRef.current(null),
    });

    onReadyRef.current?.({
      reset: () => {
        if (widgetIdRef.current != null) {
          window.turnstile?.reset(widgetIdRef.current);
        }
        onTokenChangeRef.current(null);
      },
    });

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [scriptReady]);

  if (!isTurnstileEnabled() || !siteKey) return null;

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onLoad={() => setScriptReady(true)}
      />
      <div ref={containerRef} className={className} />
    </>
  );
}
