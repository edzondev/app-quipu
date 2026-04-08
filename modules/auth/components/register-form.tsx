"use client";

import { Check, EyeIcon, EyeOffIcon, Loader2Icon, X } from "lucide-react";
import Link from "next/link";
import { Controller, useWatch } from "react-hook-form";
import { Button } from "@/core/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/core/components/ui/field";
import { Input } from "@/core/components/ui/input";
import { useRegister } from "../hooks/use-register";

const PASSWORD_RULES = [
  { label: "Al menos 6 caracteres", test: (v: string) => v.length >= 6 },
  { label: "Una letra mayúscula", test: (v: string) => /[A-Z]/.test(v) },
  { label: "Una letra minúscula", test: (v: string) => /[a-z]/.test(v) },
  { label: "Un número", test: (v: string) => /\d/.test(v) },
  {
    label: "Un carácter especial (@$!%*?&)",
    test: (v: string) => /[@$!%*?&]/.test(v),
  },
] as const;

function PasswordField({
  form,
  isPasswordVisible,
  toggleVisibility,
  isSubmitting,
}: {
  form: ReturnType<typeof useRegister>["form"];
  isPasswordVisible: boolean;
  toggleVisibility: () => void;
  isSubmitting: boolean;
}) {
  const password = useWatch({ control: form.control, name: "password" });
  const showRules = password.length > 0;

  return (
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
              aria-label={isPasswordVisible ? "Hide password" : "Show password"}
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
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </div>
          {showRules && (
            <ul className="space-y-1 mt-2 text-xs">
              {PASSWORD_RULES.map((rule) => {
                const passed = rule.test(password);
                return (
                  <li
                    key={rule.label}
                    className={passed ? "text-green-800" : "text-destructive"}
                  >
                    {passed ? (
                      <Check className="inline-block size-3" />
                    ) : (
                      <X className="inline-block size-3" />
                    )}{" "}
                    {rule.label}
                  </li>
                );
              })}
            </ul>
          )}
        </Field>
      )}
    />
  );
}

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
        <PasswordField
          form={form}
          isPasswordVisible={isPasswordVisible}
          toggleVisibility={toggleVisibility}
          isSubmitting={isSubmitting}
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
