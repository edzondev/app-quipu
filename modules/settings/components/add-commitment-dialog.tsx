"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/core/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/core/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/core/components/ui/field";
import { Input } from "@/core/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/core/components/ui/select";
import { api } from "@/convex/_generated/api";
import { Plus } from "lucide-react";

const commitmentSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  amount: z
    .number({ error: "Ingresa un monto válido" })
    .positive("El monto debe ser mayor a 0"),
  envelope: z.enum(["needs", "wants"], {
    error: "Selecciona un sobre",
  }),
});

type CommitmentFormValues = z.infer<typeof commitmentSchema>;

export function AddCommitmentDialog() {
  const [open, setOpen] = useState(false);
  const createCommitment = useMutation(
    api.fixedCommitments.createFixedCommitment,
  );

  const form = useForm<CommitmentFormValues>({
    resolver: zodResolver(commitmentSchema),
    defaultValues: {
      name: "",
      amount: 0,
      envelope: "needs",
    },
  });

  const onSubmit = form.handleSubmit(async (data) => {
    try {
      await createCommitment({
        name: data.name,
        amount: data.amount,
        envelope: data.envelope,
      });
      toast.success("Cuota agregada");
      form.reset();
      setOpen(false);
    } catch (e: unknown) {
      const message =
        e instanceof ConvexError
          ? String(e.data)
          : e instanceof Error
            ? e.message
            : "Error al agregar la cuota";
      form.setError("root", { message });
    }
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Agregar cuota
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agregar cuota o deuda fija</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <Controller
            name="name"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="commitment-name">Nombre</FieldLabel>
                <Input
                  id="commitment-name"
                  placeholder="Ej: Netflix, Cuota del carro"
                  {...field}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <Controller
            name="amount"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="commitment-amount">Monto</FieldLabel>
                <Input
                  id="commitment-amount"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="0.01"
                  placeholder="0"
                  value={field.value === 0 ? "" : field.value}
                  onChange={(e) => {
                    const val = e.target.value;
                    field.onChange(val === "" ? 0 : Number(val));
                  }}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <Controller
            name="envelope"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>Sobre</FieldLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un sobre" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="needs">Necesidades</SelectItem>
                    <SelectItem value="wants">Gustos</SelectItem>
                  </SelectContent>
                </Select>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          {form.formState.errors.root && (
            <p className="text-destructive text-sm">
              {form.formState.errors.root.message}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              Agregar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
