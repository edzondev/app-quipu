"use client";

import { Button } from "@/core/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/core/components/ui/dialog";
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
import { cn } from "@/lib/utils";
import {
  GOAL_EMOJIS,
  MONTH_OPTIONS,
  useNewGoal,
} from "@/modules/savings/hooks/use-new-goal";
import { Plus } from "lucide-react";
import { Controller } from "react-hook-form";

type Props = {
  currencySymbol: string;
};

export function NewGoalDialog({ currencySymbol }: Props) {
  const {
    form,
    open,
    handleOpenChange,
    submitError,
    isSubmitting,
    monthlyEstimate,
    monthsUntil,
    onSubmit,
  } = useNewGoal();

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {/* Trigger: the dashed "Nuevo objetivo" card */}
      <DialogTrigger asChild>
        <button
          type="button"
          className="border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 p-8 text-muted-foreground cursor-pointer hover:border-envelope-savings hover:text-envelope-savings transition-colors w-full h-full min-h-35"
        >
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            <Plus className="w-5 h-5" />
          </div>
          <p className="text-sm font-medium">Nuevo objetivo</p>
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Nuevo objetivo de ahorro</DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-5">
          <FieldGroup>
            {/* Emoji picker */}
            <Controller
              name="emoji"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Ícono</FieldLabel>
                  <div className="grid grid-cols-8 gap-1.5">
                    {GOAL_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => field.onChange(emoji)}
                        aria-label={emoji}
                        aria-pressed={field.value === emoji}
                        className={cn(
                          "flex items-center justify-center w-9 h-9 rounded-lg text-xl transition-all border-2",
                          field.value === emoji
                            ? "border-envelope-savings bg-envelope-savings/10"
                            : "border-transparent hover:border-muted-foreground/30 hover:bg-muted",
                        )}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                  {fieldState.invalid ? (
                    <FieldError errors={[fieldState.error]} />
                  ) : null}
                </Field>
              )}
            />

            {/* Name */}
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="goal-name">
                    Nombre del objetivo
                  </FieldLabel>
                  <Input
                    id="goal-name"
                    placeholder="Ej: Laptop, Viaje a Cusco"
                    aria-invalid={fieldState.invalid}
                    {...field}
                  />
                  {fieldState.invalid ? (
                    <FieldError errors={[fieldState.error]} />
                  ) : null}
                </Field>
              )}
            />

            {/* Target amount */}
            <Controller
              name="targetAmount"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="goal-amount">Monto meta</FieldLabel>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">
                      {currencySymbol}
                    </span>
                    <Input
                      id="goal-amount"
                      type="number"
                      min={0}
                      placeholder="0.00"
                      aria-invalid={fieldState.invalid}
                      className="pl-9"
                      value={field.value === 0 ? "" : field.value}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === "" ? 0 : Number(e.target.value),
                        )
                      }
                    />
                  </div>
                  {fieldState.invalid ? (
                    <FieldError errors={[fieldState.error]} />
                  ) : null}
                </Field>
              )}
            />

            {/* Deadline month */}
            <Controller
              name="deadlineMonth"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Fecha límite</FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger
                      className="w-full"
                      aria-invalid={fieldState.invalid}
                    >
                      <SelectValue placeholder="Selecciona mes y año" />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTH_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldState.invalid ? (
                    <FieldError errors={[fieldState.error]} />
                  ) : null}
                </Field>
              )}
            />
          </FieldGroup>

          {/* Live estimate — only shown when both inputs have valid values */}
          {monthlyEstimate !== null ? (
            <p className="text-xs text-muted-foreground bg-muted/50 rounded-md p-2">
              Ahorrando{" "}
              <span className="font-semibold text-foreground">
                {currencySymbol} {monthlyEstimate.toLocaleString()}
              </span>{" "}
              por mes lo logras en{" "}
              <span className="font-semibold text-foreground">
                {monthsUntil} {monthsUntil === 1 ? "mes" : "meses"}
              </span>
              .
            </p>
          ) : null}

          {submitError !== null ? (
            <p className="text-sm text-destructive">{submitError}</p>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-envelope-savings text-white hover:bg-envelope-savings/90"
            >
              {isSubmitting ? "Creando..." : "Crear objetivo"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
