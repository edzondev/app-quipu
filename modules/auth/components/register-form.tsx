"use client";

import { Button } from "@/core/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/core/components/ui/field";
import { Input } from "@/core/components/ui/input";
import Link from "next/link";
import { Controller } from "react-hook-form";
import { useRegister } from "../hooks/use-register";
import { EyeIcon, EyeOffIcon, Loader2Icon } from "lucide-react";

export function RegisterForm() {
  const {
    form,
    handleSubmit,
    isSubmitting,
    toggleVisibility,
    isPasswordVisible,
  } = useRegister();

  return (
    <form
      className="flex flex-col gap-6"
      id="form-create-user"
      onSubmit={form.handleSubmit(handleSubmit)}
    >
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Crear cuenta</h1>
          <p className="text-sm text-balance text-muted-foreground">
            Empieza a organizar tu sueldo
          </p>
        </div>
        <Controller
          name="fullName"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="user-fullname">Nombre completo</FieldLabel>
              <Input
                {...field}
                type="text"
                id="user-fullname"
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
          name="email"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="user-email">Email</FieldLabel>
              <Input
                {...field}
                type="email"
                id="user-email"
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
              <FieldLabel htmlFor="password">Contraseña</FieldLabel>
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
          <Button type="submit" form="form-create-user" disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2Icon
                aria-hidden="true"
                size={16}
                className="animate-spin"
              />
            ) : (
              "Guardar"
            )}
          </Button>
          <FieldDescription className="text-center">
            ¿Ya tienes una cuenta?{" "}
            <Link href="/login" className="underline underline-offset-4">
              Inicia sesión
            </Link>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  );
}
