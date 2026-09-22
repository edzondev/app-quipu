"use client";

import { useState } from "react";
import { buttonVariants } from "@/shared/components/ui/button-variants";
import { cn } from "@/shared/lib/utils";
import { withPending } from "@/shared/lib/with-pending";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (name: string) => Promise<void>;
};

export function SpaceCreateDialog({ open, onOpenChange, onSubmit }: Props) {
  const [name, setName] = useState("");
  const [pending, setPending] = useState(false);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/30 p-4 md:items-center">
      <div className="w-full max-w-md rounded-[14px] border border-line bg-card p-5 shadow-lg">
        <h2 className="font-serif text-xl text-ink">
          Nuevo espacio compartido
        </h2>
        <p className="mt-1 text-sm text-mute">
          Un presupuesto para dos, separado del tuyo personal.
        </p>
        <label className="mt-4 block">
          <span className="text-[12.5px] font-medium text-ink-secondary">
            Nombre
          </span>
          <input
            className="mt-1 w-full rounded-[11px] border border-line bg-canvas px-3 py-2 text-sm text-ink outline-none focus:border-qp"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Hogar, Pareja…"
          />
        </label>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            className={cn(buttonVariants({ variant: "outline" }))}
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            Cancelar
          </button>
          <button
            type="button"
            className={cn(buttonVariants({ variant: "default" }))}
            disabled={pending || name.trim().length === 0}
            onClick={() =>
              withPending(setPending, async () => {
                try {
                  await onSubmit(name.trim());
                  onOpenChange(false);
                  setName("");
                } catch {
                  // El padre muestra toast; mantener el diálogo abierto.
                }
              })
            }
          >
            {pending ? "Creando espacio…" : "Crear"}
          </button>
        </div>
      </div>
    </div>
  );
}
