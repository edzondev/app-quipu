"use client";

import { Controller } from "react-hook-form";
import type { Preloaded } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Avatar, AvatarFallback } from "@/core/components/ui/avatar";
import { Button } from "@/core/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/core/components/ui/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/core/components/ui/field";
import { Input } from "@/core/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/core/components/ui/select";
import { COUNTRY_CONFIG } from "@/modules/auth/validations/onboarding";
import { LogOut, Mail } from "lucide-react";
import { useProfile } from "../hooks/use-profile";

type Props = {
  preloaded: Preloaded<typeof api.profiles.getMyProfile>;
};

export default function ProfileView({ preloaded }: Props) {
  const {
    form,
    profile,
    email,
    handleSubmit,
    handleSignOut,
    handleCountryChange,
    isSubmitting,
  } = useProfile(preloaded);

  const { control, formState, watch } = form;
  const name = watch("name");

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarFallback className="text-2xl font-bold">
            {name?.charAt(0).toUpperCase() || "?"}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-bold">{profile?.name ?? "Perfil"}</h1>
          <p className="text-muted-foreground text-sm">{email ?? "—"}</p>
        </div>
      </div>

      <form id="profile-form" onSubmit={handleSubmit} className="space-y-6">
        {/* Datos personales */}
        <Card>
          <CardHeader>
            <CardTitle>👤 Datos personales</CardTitle>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Controller
                name="name"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="profile-name">Nombre</FieldLabel>
                    <Input
                      id="profile-name"
                      placeholder="Tu nombre"
                      {...field}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="country"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="profile-country">País</FieldLabel>
                    <Select
                      value={field.value}
                      onValueChange={(val) => {
                        field.onChange(val);
                        handleCountryChange(val);
                      }}
                    >
                      <SelectTrigger id="profile-country">
                        <SelectValue placeholder="Selecciona tu país" />
                      </SelectTrigger>
                      <SelectContent>
                        {COUNTRY_CONFIG.map((c) => (
                          <SelectItem key={c.country} value={c.country}>
                            {c.country}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="currencyName"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="profile-currency">Moneda</FieldLabel>
                    <Select
                      value={field.value}
                      onValueChange={(val) => {
                        const config = COUNTRY_CONFIG.find(
                          (c) => c.currencyName === val,
                        );
                        if (config) handleCountryChange(config.country);
                      }}
                    >
                      <SelectTrigger id="profile-currency">
                        <SelectValue placeholder="Selecciona tu moneda" />
                      </SelectTrigger>
                      <SelectContent>
                        {COUNTRY_CONFIG.map((c) => (
                          <SelectItem
                            key={c.currencyCode}
                            value={c.currencyName}
                          >
                            {c.currencySymbol} {c.currencyName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </FieldGroup>
          </CardContent>
        </Card>

        {/* Cuenta */}
        <Card>
          <CardHeader>
            <CardTitle>🔒 Cuenta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field>
              <FieldLabel>Correo electrónico</FieldLabel>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={email ?? ""}
                  readOnly
                  className="pl-10 bg-muted cursor-not-allowed"
                />
              </div>
            </Field>
            <Button type="button" variant="outline" disabled className="w-full">
              Cambiar contraseña (próximamente)
            </Button>
          </CardContent>
        </Card>

        {formState.errors.root && (
          <p className="text-destructive text-sm">
            {formState.errors.root.message}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Guardando..." : "Guardar cambios"}
        </Button>
      </form>

      <Button
        type="button"
        variant="ghost"
        className="w-full text-destructive hover:text-destructive"
        onClick={handleSignOut}
      >
        <LogOut className="mr-2 h-4 w-4" />
        Cerrar sesión
      </Button>
    </div>
  );
}
