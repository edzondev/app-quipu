"use client";

import Link from "next/link";
import { Controller } from "react-hook-form";
import { Button } from "@/core/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/core/components/ui/field";
import { Input } from "@/core/components/ui/input";
import { useLogin } from "../hooks/use-login";
import { EyeIcon, EyeOffIcon, Loader2 } from "lucide-react";

export function LoginForm() {
  const {
    form,
    handleSubmitLogin,
    isSubmitting,
    isPasswordVisible,
    toggleVisibility,
  } = useLogin();

  return (
    <form
      className="flex flex-col gap-6"
      id="form-login"
      onSubmit={form.handleSubmit(handleSubmitLogin)}
    >
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Inicia sesión</h1>
          <p className="text-sm text-balance text-muted-foreground">
            Accede a tu plan financiero
          </p>
        </div>
        <Controller
          name="email"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="form-rhf-demo-title">Email</FieldLabel>
              <Input
                {...field}
                type="email"
                id="email"
                aria-invalid={fieldState.invalid}
                placeholder="jhondoe@gmail.com"
                disabled={isSubmitting}
                readOnly={isSubmitting}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="password"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <div className="flex items-center justify-between">
                <FieldLabel htmlFor="password">Contraseña</FieldLabel>
                <span className="ml-auto text-sm underline-offset-4 hover:underline cursor-pointer">
                  Olvidaste tu contraseña?
                </span>
              </div>

              <div className="relative">
                <Input
                  {...field}
                  type={isPasswordVisible ? "text" : "password"}
                  id="password"
                  aria-invalid={fieldState.invalid}
                  placeholder="*********"
                  disabled={isSubmitting}
                  readOnly={isSubmitting}
                />
                <button
                  aria-controls="password"
                  aria-label={
                    isPasswordVisible ? "Hide password" : "Show password"
                  }
                  aria-pressed={isPasswordVisible}
                  className="absolute inset-y-0 inset-e-0 flex h-full w-9 items-center justify-center rounded-e-md text-muted-foreground/80 outline-none transition-[color,box-shadow] hover:text-foreground focus:z-10 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={toggleVisibility}
                  type="button"
                >
                  {isPasswordVisible ? (
                    <EyeOffIcon aria-hidden="true" size={16} />
                  ) : (
                    <EyeIcon aria-hidden="true" size={16} />
                  )}
                </button>
              </div>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Field orientation="responsive">
          <Button type="submit" form="form-login" disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="animate-spin " />
            ) : (
              "Iniciar sesión"
            )}
          </Button>
          <FieldDescription className="text-center">
            No tienes una cuenta?{" "}
            <Link href="/register" className="underline underline-offset-4">
              Regístrate
            </Link>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  );
}
