"use client";

import { Controller, useWatch } from "react-hook-form";
import { usePathname } from "next/navigation";
import { useEnvelopes } from "@/core/hooks/use-envelopes";
import useCreateExpense from "@/core/hooks/use-create-expense";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/core/components/ui/drawer";
import { Button } from "@/core/components/ui/button";
import { Field, FieldError } from "@/core/components/ui/field";
import { cn } from "@/lib/utils";
import { Crown, Plus, Delete } from "lucide-react";
import Link from "next/link";

const HIDDEN_ROUTES = ["/add-expense", "/", "/onboarding"];

const KEYPAD = [
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  ".",
  "0",
  "delete",
];

export default function QuickExpenseFAB() {
  const pathname = usePathname();
  const {
    mutate,
    form,
    handleKeypad,
    displayValue,
    handleEnvelopeChange,
    isAtLimit,
    limitLabel,
  } = useCreateExpense();
  const { envelopes } = useEnvelopes();
  const selectedEnvelope = useWatch({
    control: form.control,
    name: "envelope",
  });

  const isLoading = envelopes === undefined;

  if (HIDDEN_ROUTES.includes(pathname)) return null;
  if (isLoading) return null;

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <button
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-105 transition-transform active:scale-95"
          aria-label="Registro rápido de gasto"
        >
          <Plus className="w-6 h-6" />
        </button>
      </DrawerTrigger>

      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="pb-2">
          <DrawerTitle className="text-center text-lg flex items-center justify-center gap-2">
            Gasto rápido
            {limitLabel !== null ? (
              <span
                className={cn(
                  "text-xs font-medium px-2 py-0.5 rounded-full",
                  isAtLimit
                    ? "bg-destructive/10 text-destructive"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {limitLabel}
              </span>
            ) : null}
          </DrawerTitle>
        </DrawerHeader>

        {/* Limit reached state */}
        {isAtLimit ? (
          <div className="px-4 pb-8 flex flex-col items-center gap-4 text-center">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/40 mt-2">
              <Crown className="w-6 h-6 text-amber-500" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold">
                Límite del plan gratuito alcanzado
              </p>
              <p className="text-xs text-muted-foreground max-w-56">
                Alcanzaste los 20 gastos del mes. Hazte Premium para registrar
                gastos ilimitados.
              </p>
            </div>
            <Button size="sm" asChild className="gap-1.5">
              <Link href="/upgrade">
                <Crown className="w-3.5 h-3.5" />
                Ver planes
              </Link>
            </Button>
          </div>
        ) : null}

        <div
          className={cn(
            "px-4 pb-6 space-y-4",
            isAtLimit ? "hidden" : undefined,
          )}
        >
          {/* Envelope cards */}
          <div className="flex gap-3">
            {envelopes &&
              envelopes.map((env) => (
                <button
                  key={env.key}
                  onClick={() => handleEnvelopeChange(env.key)}
                  className={cn(
                    "flex-1 rounded-xl border-2 p-3 text-left transition-colors border-border bg-card",
                    env.key === selectedEnvelope
                      ? `border-purple-500 bg-purple-500/10`
                      : undefined,
                  )}
                >
                  <span className="text-xl">{env.emoji}</span>
                  <p className="text-sm font-medium mt-1">{env.label}</p>
                  <p className="text-xs text-muted-foreground">
                    Disponible: {env.available.toFixed(2)}
                  </p>
                </button>
              ))}
          </div>

          {/* Amount display */}
          <div className="text-center py-3">
            <span className="text-3xl font-bold tracking-tight">
              {displayValue}
            </span>
          </div>

          <form onSubmit={form.handleSubmit(mutate)}>
            {/* Numpad */}
            <Controller
              name="amount"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field
                  data-invalid={fieldState.invalid}
                  className="grid grid-cols-3 gap-2 mx-auto space-y-4"
                >
                  {KEYPAD.map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleKeypad(key)}
                      className="h-14 rounded-xl bg-muted text-foreground text-lg font-medium flex items-center justify-center active:bg-muted-foreground/20 transition-colors"
                    >
                      {key === "delete" ? <Delete className="w-5 h-5" /> : key}
                    </button>
                  ))}
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            {/* Submit */}
            <Button
              type="submit"
              className="w-full h-12 text-base"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? "Registrando..." : "Registrar"}
            </Button>
          </form>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
