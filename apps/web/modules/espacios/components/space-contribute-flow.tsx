"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel";
import { AnalyticsEvents, track } from "@/core/analytics";
import { fromConvexError } from "@/core/errors";
import { withPending } from "@/shared/lib/with-pending";
import { useContributeToSpace } from "../actions";
import {
  SpaceEnvelopePicker,
  type SpaceEnvelopeType,
} from "./space-envelope-picker";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  spaceId: Id<"financialSpaces">;
};

export function SpaceContributeFlow({ open, onOpenChange, spaceId }: Props) {
  const contribute = useContributeToSpace();
  const [amount, setAmount] = useState("");
  const [personalEnvelopeType, setPersonalEnvelopeType] =
    useState<SpaceEnvelopeType>("needs");
  const [spaceEnvelopeType, setSpaceEnvelopeType] =
    useState<SpaceEnvelopeType>("needs");
  const [pending, setPending] = useState(false);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/30 p-4 md:items-center">
      <div className="w-full max-w-md rounded-[14px] border border-line bg-card p-5">
        <h2 className="font-serif text-xl text-ink">Aportar al espacio</h2>
        <p className="mt-1 text-sm text-mute">
          Debita tu sobre personal y acredita el presupuesto compartido. Elige
          bien el sobre destino: el gasto solo puede salir del sobre donde
          aportaste.
        </p>
        <input
          className="mt-4 w-full rounded-[11px] border border-line bg-canvas px-3 py-2 text-sm"
          inputMode="decimal"
          aria-label="Monto"
          placeholder="Monto"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
        />
        <SpaceEnvelopePicker
          label="Desde tu sobre personal"
          value={personalEnvelopeType}
          onChange={setPersonalEnvelopeType}
        />
        <SpaceEnvelopePicker
          label="Al sobre del espacio"
          value={spaceEnvelopeType}
          onChange={setSpaceEnvelopeType}
        />
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            className="rounded-[11px] border border-line px-4 py-2 text-sm"
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="rounded-[11px] bg-ink px-4 py-2 text-sm font-semibold text-canvas"
            disabled={pending}
            onClick={async () => {
              const cents = Math.round(Number.parseFloat(amount) * 100);
              if (!Number.isFinite(cents) || cents <= 0) {
                toast.error("Ingresa un monto válido.");
                return;
              }
              await withPending(setPending, async () => {
                try {
                  await contribute({
                    spaceId,
                    amountCents: cents,
                    personalEnvelopeType,
                    spaceEnvelopeType,
                  });
                  track(AnalyticsEvents.SPACE_CONTRIBUTION_COMPLETED, {
                    space_id: spaceId,
                    amount: cents,
                    personal_envelope: personalEnvelopeType,
                    space_envelope: spaceEnvelopeType,
                  });
                  toast.success("Aporte registrado");
                  onOpenChange(false);
                  setAmount("");
                } catch (error) {
                  toast.error(fromConvexError(error).message);
                }
              });
            }}
          >
            {pending ? "Registrando…" : "Confirmar aporte"}
          </button>
        </div>
      </div>
    </div>
  );
}
