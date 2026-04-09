"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { useEffect } from "react";
import { getPosthogHost, getPosthogKey } from "@/lib/env";

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const key = getPosthogKey();
    if (!key) return;

    posthog.init(key, {
      api_host: getPosthogHost(),
      ui_host: "https://us.posthog.com",
      capture_pageview: false, // We capture manually via SuspendedPostHogPageView
      capture_pageleave: true,
    });
  }, []);

  return <PHProvider client={posthog}>{children}</PHProvider>;
}
