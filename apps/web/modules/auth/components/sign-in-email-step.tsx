"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import type { TurnstileWidgetApi } from "@/shared/components/turnstile-widget";
import { Button } from "@/shared/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/shared/components/ui/field";
import { authLabelClass, authPrimaryButtonClass } from "../constants";
import { appendAuthReturnTo } from "../lib/auth-return-to";
import { AuthBanner } from "./auth-banner";
import { AuthInput } from "./auth-input";
import { RecoverPasswordLink } from "./recover-password-link";

const SignInPasskeyAlternative = dynamic(
  () =>
    import("./sign-in-passkey-button").then(
      (mod) => mod.SignInPasskeyAlternative,
    ),
  { ssr: false },
);

const TurnstileWidget = dynamic(
  () =>
    import("@/shared/components/turnstile-widget").then(
      (mod) => mod.TurnstileWidget,
    ),
  { ssr: false },
);

export function EmailStep({
  form,
  reason,
  error,
  showPasskey,
  returnTo,
  turnstileToken,
  onTurnstileTokenChange,
  onTurnstileReady,
  onPasskeyAttemptComplete,
}: {
  form: any;
  reason?: string;
  error: "credentials" | "passkey" | "unverified" | null;
  showPasskey: boolean;
  returnTo?: string;
  turnstileToken?: string | null;
  onTurnstileTokenChange: (token: string | null) => void;
  onTurnstileReady: (api: TurnstileWidgetApi) => void;
  onPasskeyAttemptComplete: () => void;
}) {
  return (
    <>
      <h1 className="font-serif font-medium text-[28px] text-ink leading-[1.12] lg:hidden">
        Bienvenido
        <br />
        de vuelta.
      </h1>
      <h1 className="hidden font-semibold text-[22px] text-ink lg:block">
        Iniciar sesión
      </h1>

      {reason === "exists" && (
        <AuthBanner
          variant="info"
          title="Ya tienes cuenta"
          description="Entra con tu passkey o tu contraseña."
        />
      )}
      {error === "passkey" && (
        <AuthBanner
          variant="error"
          title="No pudimos verificar tu passkey"
          description="Prueba de nuevo o usa tu correo."
        />
      )}

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
            {(field: any) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name} className={authLabelClass}>
                    Correo
                  </FieldLabel>
                  <AuthInput
                    id={field.name}
                    type="email"
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                    autoComplete="username webauthn"
                    autoFocus
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          </form.Field>
        </FieldGroup>
        <form.Subscribe selector={(s: any) => [s.canSubmit, s.isSubmitting]}>
          {([canSubmit, isSubmitting]: [boolean, boolean]) => (
            <Button
              type="submit"
              disabled={!canSubmit || isSubmitting}
              className={authPrimaryButtonClass}
            >
              {isSubmitting ? "Comprobando..." : "Continuar"}
            </Button>
          )}
        </form.Subscribe>
      </form>
      {showPasskey ? (
        <TurnstileWidget
          onTokenChange={onTurnstileTokenChange}
          onReady={onTurnstileReady}
          className="min-h-16"
        />
      ) : null}
      <div className="flex justify-end">
        <form.Subscribe
          selector={(s: { values: { email: string } }) => s.values.email}
        >
          {(email: string) => <RecoverPasswordLink email={email} />}
        </form.Subscribe>
      </div>
      {showPasskey ? (
        <SignInPasskeyAlternative
          label="o"
          returnTo={returnTo}
          turnstileToken={turnstileToken}
          onAttemptComplete={onPasskeyAttemptComplete}
        />
      ) : null}
      <div className="mt-1 flex justify-center lg:justify-end">
        <Link
          href={appendAuthReturnTo("/sign-up", returnTo)}
          className="text-[13px] font-medium text-qp-deep hover:underline"
        >
          Crear una cuenta nueva
        </Link>
      </div>
    </>
  );
}
