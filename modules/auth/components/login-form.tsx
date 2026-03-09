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
  FieldSeparator,
} from "@/core/components/ui/field";
import { Input } from "@/core/components/ui/input";
import { useLogin } from "../hooks/use-login";

export function LoginForm() {
  const { form, handleSubmitLogin } = useLogin();

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
              <Input
                {...field}
                type="password"
                id="password"
                aria-invalid={fieldState.invalid}
                placeholder="*********"
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Field orientation="responsive">
          <Button type="submit" form="form-login">
            {form.formState.isSubmitting ? "Cargando..." : "Iniciar sesión"}
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
