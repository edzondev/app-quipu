"use client";

import { useForm } from "@tanstack/react-form";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useState } from "react";
import { authClient } from "@/auth/auth-client";
import { clientEnv } from "@/core/env.client";
import { QuipuLogo } from "@/shared/components/quipu-logo";
import { Button } from "@/shared/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/shared/components/ui/field";
import { emailOnlySchema } from "@/shared/lib/validation/auth";
import { authLabelClass, authPrimaryButtonClass } from "../constants";
import {
  authFetchOptions,
  requireTurnstileToken,
} from "../lib/auth-fetch-options";
import { useTurnstileChallenge } from "../lib/use-turnstile-challenge";
import { AuthBanner } from "./auth-banner";
import { AuthInput } from "./auth-input";
import { AuthSidePanel } from "./auth-side-panel";

const TurnstileWidget = dynamic(
  () =>
    import("@/shared/components/turnstile-widget").then(
      (mod) => mod.TurnstileWidget,
    ),
  { ssr: false },
);

export function ForgotPasswordView({
  initialEmail = "",
}: {
  initialEmail?: string;
}) {
  const [sent, setSent] = useState(false);
  const [requestError, setRequestError] = useState(false);
  const turnstile = useTurnstileChallenge();

  const form = useForm({
    defaultValues: { email: initialEmail },
    validators: { onChange: emailOnlySchema },
    onSubmit: async ({ value }) => {
      setRequestError(false);
      if (
        !requireTurnstileToken(
          turnstile.token,
          clientEnv.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
        )
      ) {
        setRequestError(true);
        return;
      }
      const { error } = await authClient.$fetch("/request-password-reset", {
        method: "POST",
        body: {
          email: value.email,
          redirectTo: `${clientEnv.NEXT_PUBLIC_APP_URL}/restablecer-contrasena`,
        },
        ...authFetchOptions(turnstile.token),
      });
      turnstile.reset();
      if (error) {
        setRequestError(true);
        return;
      }
      setSent(true);
    },
  });

  return (
    <div className="grid min-h-svh lg:grid-cols-[400px_1fr]">
      <AuthSidePanel />
      <div className="flex flex-col px-6 py-8 sm:px-10">
        <div className="lg:hidden">
          <QuipuLogo />
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="flex w-full max-w-95 flex-col gap-5">
            <h1 className="font-serif text-[26px] font-medium text-ink">
              Recuperar acceso
            </h1>
            {sent ? (
              <>
                <AuthBanner
                  variant="info"
                  title="Revisa tu correo"
                  description="Si existe una cuenta con ese email, te enviamos un enlace para elegir una contraseña nueva. El enlace caduca en una hora."
                />
                <Link
                  href="/sign-in"
                  className="text-center text-[13.5px] font-medium text-qp-deep hover:underline"
                >
                  Volver a iniciar sesión
                </Link>
              </>
            ) : (
              <>
                {requestError ? (
                  <AuthBanner
                    variant="error"
                    title="No pudimos enviar el enlace"
                    description="Intenta de nuevo en un momento. Si el problema continúa, el envío de correo puede no estar activo aún."
                  />
                ) : null}
                <p className="text-[14.5px] text-mute">
                  Te mandamos un enlace seguro. No te pedimos datos bancarios ni
                  contraseña actual por correo.
                </p>
                <form
                  className="flex flex-col gap-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    form.handleSubmit();
                  }}
                >
                  <FieldGroup>
                    <form.Field name="email">
                      {(field) => {
                        const isInvalid =
                          field.state.meta.isTouched &&
                          !field.state.meta.isValid;
                        return (
                          <Field data-invalid={isInvalid}>
                            <FieldLabel
                              htmlFor={field.name}
                              className={authLabelClass}
                            >
                              Correo
                            </FieldLabel>
                            <AuthInput
                              id={field.name}
                              type="email"
                              name={field.name}
                              value={field.state.value}
                              onBlur={field.handleBlur}
                              onChange={(e) =>
                                field.handleChange(e.target.value)
                              }
                              aria-invalid={isInvalid}
                              autoComplete="email"
                              autoFocus
                            />
                            {isInvalid ? (
                              <FieldError errors={field.state.meta.errors} />
                            ) : null}
                          </Field>
                        );
                      }}
                    </form.Field>
                  </FieldGroup>
                  <TurnstileWidget
                    onTokenChange={turnstile.onTokenChange}
                    onReady={turnstile.onReady}
                    className="min-h-16"
                  />
                  <form.Subscribe
                    selector={(s) => [s.canSubmit, s.isSubmitting] as const}
                  >
                    {([canSubmit, isSubmitting]) => (
                      <Button
                        type="submit"
                        disabled={!canSubmit || isSubmitting}
                        className={authPrimaryButtonClass}
                      >
                        {isSubmitting ? "Enviando..." : "Enviar enlace"}
                      </Button>
                    )}
                  </form.Subscribe>
                </form>
                <Link
                  href="/sign-in"
                  className="text-center text-[13.5px] font-medium text-qp-deep hover:underline"
                >
                  Volver a iniciar sesión
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
