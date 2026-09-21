"use client";
import { useForm } from "@tanstack/react-form";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { authClient } from "@/auth/auth-client";
import { AnalyticsEvents, getAuthSignupContext, track } from "@/core/analytics";
import { clientEnv } from "@/core/env.client";
import { QuipuLogo } from "@/shared/components/quipu-logo";
import { AnimatedView } from "@/shared/components/ui/animated-view";
import { Button } from "@/shared/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/shared/components/ui/field";
import { cn } from "@/shared/lib/utils";
import { authLabelClass, authPrimaryButtonClass } from "../constants";
import {
  authFetchOptions,
  requireTurnstileToken,
} from "../lib/auth-fetch-options";
import {
  appendAuthReturnTo,
  resolveAuthDestination,
} from "../lib/auth-return-to";
import { navigateAfterAuth } from "../lib/navigate-after-auth";
import { useTurnstileChallenge } from "../lib/use-turnstile-challenge";
import { signUpSchema } from "../schemas";
import { AuthBanner } from "./auth-banner";
import { AuthInput } from "./auth-input";
import { SuccessStep } from "./sign-up-success-step";
import { VerifyEmailPromptStep } from "./verify-email-prompt-step";

const TurnstileWidget = dynamic(
  () =>
    import("@/shared/components/turnstile-widget").then(
      (mod) => mod.TurnstileWidget,
    ),
  { ssr: false },
);

const PasskeySetup = dynamic(
  () => import("./passkey-setup").then((mod) => mod.PasskeySetup),
  { ssr: false },
);

type Step = "form" | "verify-email" | "passkey" | "success";

function isUserAlreadyExists(error: {
  code?: string;
  status?: number;
  message?: string;
}) {
  return (
    error.code === "USER_ALREADY_EXISTS" ||
    error.status === 422 ||
    error.message?.toLowerCase().includes("already exists")
  );
}

const bgByStep: Record<Step, string> = {
  form: "bg-[radial-gradient(110%_70%_at_50%_-10%,var(--qp-surface-warm),var(--qp-surface)_60%)]",
  "verify-email":
    "bg-[radial-gradient(110%_70%_at_50%_-5%,var(--qp-selected),var(--qp-surface)_62%)]",
  passkey:
    "bg-[radial-gradient(110%_70%_at_50%_-5%,var(--qp-selected),var(--qp-surface)_62%)]",
  success:
    "bg-[radial-gradient(110%_70%_at_50%_-5%,var(--qp-success),var(--qp-surface)_60%)]",
};

const stepLabel: Record<Step, string> = {
  form: "Paso 1 de 3: crea tu cuenta",
  "verify-email": "Confirma tu correo",
  passkey: "Paso 2 de 3: configura tu passkey",
  success: "Cuenta lista",
};

export function SignUpView({
  initialEmail = "",
  returnTo,
}: {
  initialEmail?: string;
  returnTo?: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("form");
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [serverError, setServerError] = useState(false);

  const [registeredEmail, setRegisteredEmail] = useState("");
  const turnstile = useTurnstileChallenge();

  const form = useForm({
    defaultValues: { name: "", email: initialEmail, password: "" },
    validators: { onChange: signUpSchema },
    onSubmit: async ({ value }) => {
      setServerError(false);
      if (
        !requireTurnstileToken(
          turnstile.token,
          clientEnv.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
        )
      ) {
        setServerError(true);
        return;
      }
      const { error } = await authClient.signUp.email(
        {
          email: value.email,
          password: value.password,
          name: value.name,
          callbackURL: appendAuthReturnTo("/sign-in", returnTo),
        },
        authFetchOptions(turnstile.token),
      );
      turnstile.reset();
      if (error) {
        if (isUserAlreadyExists(error)) {
          router.push(
            `/sign-in?email=${encodeURIComponent(value.email)}&reason=exists`,
          );
          return;
        }
        setServerError(true);
        return;
      }
      track(AnalyticsEvents.USER_SIGNED_UP, {
        provider: "email",
        ...getAuthSignupContext(),
      });
      toast.success("Revisa tu correo para confirmar la cuenta");
      setRegisteredEmail(value.email);
      setDirection("forward");
      setStep("verify-email");
    },
  });

  return (
    <div
      className={cn(
        "flex min-h-svh flex-col items-center justify-center px-6 py-10",
        bgByStep[step],
      )}
    >
      <p aria-live="polite" className="sr-only">
        {stepLabel[step]}
      </p>

      <AnimatedView
        viewKey={step}
        direction={direction}
        aria-live="off"
        className="w-full max-w-95"
      >
        {step === "form" && (
          <>
            <QuipuLogo className="mb-6.5" />
            <h1 className="font-serif font-medium text-[29px] text-ink">
              Crea tu cuenta
            </h1>
            <p className="mt-1.5 mb-6.5 text-[14.5px] text-mute">
              Empieza a ordenar tu dinero en dos minutos.
            </p>

            {serverError && (
              <div className="mb-5">
                <AuthBanner
                  variant="error"
                  title="No pudimos crear tu cuenta"
                  description="Intenta de nuevo en un momento."
                />
              </div>
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
                <form.Field name="name">
                  {(field: any) => {
                    const isInvalid =
                      field.state.meta.isTouched && !field.state.meta.isValid;
                    return (
                      <Field data-invalid={isInvalid}>
                        <FieldLabel
                          htmlFor={field.name}
                          className={authLabelClass}
                        >
                          Nombre
                        </FieldLabel>
                        <AuthInput
                          id={field.name}
                          type="text"
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          aria-invalid={isInvalid}
                          autoComplete="name"
                          autoFocus
                        />
                        {isInvalid && (
                          <FieldError errors={field.state.meta.errors} />
                        )}
                      </Field>
                    );
                  }}
                </form.Field>
                <form.Field name="email">
                  {(field: any) => {
                    const isInvalid =
                      field.state.meta.isTouched && !field.state.meta.isValid;
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
                          onChange={(e) => field.handleChange(e.target.value)}
                          aria-invalid={isInvalid}
                          autoComplete="email"
                        />
                        {isInvalid && (
                          <FieldError errors={field.state.meta.errors} />
                        )}
                      </Field>
                    );
                  }}
                </form.Field>
                <form.Field name="password">
                  {(field: any) => {
                    const isInvalid =
                      field.state.meta.isTouched && !field.state.meta.isValid;
                    return (
                      <Field data-invalid={isInvalid}>
                        <FieldLabel
                          htmlFor={field.name}
                          className={authLabelClass}
                        >
                          Contraseña
                        </FieldLabel>
                        <AuthInput
                          id={field.name}
                          type="password"
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          aria-invalid={isInvalid}
                          autoComplete="new-password"
                        />
                        {isInvalid && (
                          <FieldError errors={field.state.meta.errors} />
                        )}
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
                selector={(s: any) => [s.canSubmit, s.isSubmitting]}
              >
                {([canSubmit, isSubmitting]: any) => (
                  <Button
                    type="submit"
                    disabled={!canSubmit || isSubmitting}
                    className={authPrimaryButtonClass}
                  >
                    {isSubmitting ? "Creando tu cuenta..." : "Crear cuenta"}
                  </Button>
                )}
              </form.Subscribe>
            </form>

            <p className="mt-3.5 text-center text-[11.5px] text-faint leading-normal">
              Al crear tu cuenta aceptas los{" "}
              <Link href="/terminos" className="underline underline-offset-2">
                Términos
              </Link>{" "}
              y la{" "}
              <Link href="/privacidad" className="underline underline-offset-2">
                Política de privacidad
              </Link>
              .
            </p>
          </>
        )}

        {step === "verify-email" && (
          <VerifyEmailPromptStep email={registeredEmail} returnTo={returnTo} />
        )}

        {step === "passkey" && (
          <PasskeySetup
            onDone={() => {
              setDirection("forward");
              setStep("success");
            }}
          />
        )}

        {step === "success" && (
          <SuccessStep
            onContinue={() => {
              navigateAfterAuth(
                resolveAuthDestination(returnTo, "/onboarding"),
              );
            }}
          />
        )}
      </AnimatedView>
    </div>
  );
}
