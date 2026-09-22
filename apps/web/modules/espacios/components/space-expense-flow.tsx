"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel";
import { AnalyticsEvents, track } from "@/core/analytics";
import { fromConvexError } from "@/core/errors";
import { useRegisterSpaceExpense } from "../actions";
import {
  SpaceEnvelopePicker,
  type SpaceEnvelopeType,
} from "./space-envelope-picker";

type EnvelopeBalance = {
  type: SpaceEnvelopeType;
  remainingAmount: number;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  spaceId: Id<"financialSpaces">;
  allowPersonalPocket?: boolean;
  envelopes?: EnvelopeBalance[];
  currencyCode?: string;
};

export function SpaceExpenseFlow({
  open,
  onOpenChange,
  spaceId,
  allowPersonalPocket = true,
  envelopes = [],
  currencyCode = "PEN",
}: Props) {
  const register = useRegisterSpaceExpense();
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [envelopeType, setEnvelopeType] = useState<SpaceEnvelopeType>("needs");
  const [fundingSource, setFundingSource] = useState<
    "space_budget" | "personal_pocket"
  >("space_budget");
  const [pending, startSubmit] = useTransition();

  const effectiveFundingSource = allowPersonalPocket
    ? fundingSource
    : "space_budget";

  if (!open) return null;

  const envelopeBalances = Object.fromEntries(
    envelopes.map((envelope) => [envelope.type, envelope.remainingAmount]),
  ) as Partial<Record<SpaceEnvelopeType, number>>;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/30 p-4 md:items-center">
      <div className="w-full max-w-md rounded-[14px] border border-line bg-card p-5">
        <h2 className="font-serif text-xl text-ink">Gasto compartido</h2>
        <input
          className="mt-4 w-full rounded-[11px] border border-line bg-canvas px-3 py-2 text-sm"
          aria-label="Descripción"
          placeholder="Descripción"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
        <input
          className="mt-3 w-full rounded-[11px] border border-line bg-canvas px-3 py-2 text-sm"
          inputMode="decimal"
          aria-label="Monto"
          placeholder="Monto"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
        />
        <SpaceEnvelopePicker
          label="Sobre del espacio"
          value={envelopeType}
          onChange={setEnvelopeType}
          mode="expense"
          balances={envelopeBalances}
          currencyCode={currencyCode}
        />
        <div className="mt-3 flex gap-2">
          {(["space_budget", "personal_pocket"] as const).map((source) => {
            if (source === "personal_pocket" && !allowPersonalPocket)
              return null;
            return (
              <button
                key={source}
                type="button"
                className={`rounded-[11px] border px-3 py-2 text-xs ${
                  effectiveFundingSource === source
                    ? "border-qp bg-qp/10 text-qp-deep"
                    : "border-line text-mute"
                }`}
                onClick={() => setFundingSource(source)}
              >
                {source === "space_budget"
                  ? "Presupuesto espacio"
                  : "Bolsillo personal"}
              </button>
            );
          })}
        </div>
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
            onClick={() => {
              const cents = Math.round(Number.parseFloat(amount) * 100);
              if (
                !Number.isFinite(cents) ||
                cents <= 0 ||
                !description.trim()
              ) {
                toast.error("Completa descripción y monto válido.");
                return;
              }
              startSubmit(async () => {
                try {
                  await register({
                    spaceId,
                    amount: cents,
                    description: description.trim(),
                    envelopeType,
                    fundingSource: effectiveFundingSource,
                  });
                  track(AnalyticsEvents.SPACE_EXPENSE_REGISTERED, {
                    space_id: spaceId,
                    amount: cents,
                    envelope: envelopeType,
                    funding_source: effectiveFundingSource,
                  });
                  toast.success("Gasto registrado");
                  onOpenChange(false);
                  setAmount("");
                  setDescription("");
                } catch (error) {
                  toast.error(fromConvexError(error).message);
                }
              });
            }}
          >
            {pending ? "Registrando…" : "Registrar"}
          </button>
        </div>
      </div>
    </div>
  );
}
