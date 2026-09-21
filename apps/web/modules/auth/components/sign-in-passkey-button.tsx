"use client";
import { useState } from "react";
import { LockKeyholeOpen } from "reicon-react/icons/LockKeyholeOpen";
import { toast } from "sonner";
import { authClient } from "@/auth/auth-client";
import {
  AnalyticsEvents,
  stampAndComputeDaysSinceLastLogin,
  track,
} from "@/core/analytics";
import { clientEnv } from "@/core/env.client";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";
import { authSecondaryButtonClass } from "../constants";
import {
  authFetchOptions,
  requireTurnstileToken,
} from "../lib/auth-fetch-options";
import { resolveAuthDestination } from "../lib/auth-return-to";
import { navigateAfterAuth } from "../lib/navigate-after-auth";

export function SignInPasskeyButton({
  returnTo,
  turnstileToken = null,
  onAttemptComplete,
}: {
  returnTo?: string;
  turnstileToken?: string | null;
  onAttemptComplete?: () => void;
}) {
  const [pending, setPending] = useState(false);
  const postAuthDestination = resolveAuthDestination(returnTo, "/dashboard");

  async function handleClick() {
    if (
      !requireTurnstileToken(
        turnstileToken,
        clientEnv.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
      )
    ) {
      return;
    }
    setPending(true);
    const { error } = await authClient.signIn
      .passkey({
        fetchOptions: authFetchOptions(turnstileToken),
      })
      .finally(() => {
        setPending(false);
        onAttemptComplete?.();
      });
    if (error) return;
    track(AnalyticsEvents.USER_LOGGED_IN, {
      method: "passkey",
      days_since_last_login: stampAndComputeDaysSinceLastLogin(),
    });
    toast.success("Bienvenido de vuelta");
    navigateAfterAuth(postAuthDestination);
  }

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleClick}
      disabled={pending}
      className={cn(authSecondaryButtonClass, "gap-2.5")}
    >
      <LockKeyholeOpen size={24} />
      {pending ? "Verificando..." : "Entrar con passkey"}
    </Button>
  );
}
