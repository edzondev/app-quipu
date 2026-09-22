"use client";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { formatCents, parseToCents } from "@/shared/lib/money";
import type { SimpleCorrectionWizardValues } from "../lib/simple-correction-schema";

type NewCommitment = NonNullable<SimpleCorrectionWizardValues["newCommitment"]>;

type Props = {
  incomeCents: number;
  spentCents: number;
  reservedText: string;
  reservedMode: SimpleCorrectionWizardValues["reservedMode"];
  commitmentId: string;
  newCommitment: NewCommitment;
  commitments: Array<{ id: string; name: string; amount: number }>;
  currencyCode: string;
  onReservedChange: (value: string) => void;
  onModeChange: (mode: SimpleCorrectionWizardValues["reservedMode"]) => void;
  onCommitmentChange: (id: string) => void;
  onNewCommitmentChange: (value: NewCommitment) => void;
  onBack: () => void;
  onNext: () => void;
};

const MODE_OPTIONS = [
  { mode: "none" as const, label: "No voy a apartar nada todavía" },
  { mode: "existing" as const, label: "De un compromiso que ya tengo" },
  { mode: "create" as const, label: "Crear un compromiso nuevo" },
  { mode: "generic" as const, label: "Solo apartarlo, sin compromiso" },
];

export function WizardStepReserved(props: Props) {
  const reservedCents = parseToCents(props.reservedText) ?? 0;
  const maxDistributable = props.incomeCents - props.spentCents;
  const exceeds = reservedCents > props.incomeCents;
  const exceedsReal = reservedCents > maxDistributable;
  const amountMissing = props.reservedMode !== "none" && reservedCents <= 0;
  const missingCommitment =
    props.reservedMode === "existing" && !props.commitmentId;
  const newCommitmentInvalid =
    props.reservedMode === "create" &&
    (!props.newCommitment.name.trim() ||
      reservedCents <= 0 ||
      props.newCommitment.dueDay < 1 ||
      props.newCommitment.dueDay > 31);
  const canContinue =
    !exceeds &&
    !exceedsReal &&
    !amountMissing &&
    !missingCommitment &&
    !newCommitmentInvalid;
  const disponibleReal =
    props.spentCents > 0
      ? `Disponible real: ${formatCents(maxDistributable, { currency: props.currencyCode })} (${formatCents(props.incomeCents, { currency: props.currencyCode })} − ${formatCents(props.spentCents, { currency: props.currencyCode })} gastado)`
      : null;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-serif text-xl text-ink">¿Cuánto ya tiene dueño?</h2>
        <p className="mt-1 text-sm text-mute">
          Dinero que debes separar para compromisos fijos, como cuotas o deudas.
        </p>
      </div>
      {props.reservedMode !== "none" ? (
        <div>
          <Label htmlFor="wizard-reserved-amount">Monto apartado</Label>
          <Input
            id="wizard-reserved-amount"
            className="mt-1.5 h-12 text-center font-serif text-xl"
            inputMode="decimal"
            placeholder="0.00"
            value={props.reservedText}
            onChange={(event) => props.onReservedChange(event.target.value)}
          />
          {exceeds ? (
            <p className="mt-1 text-[12px] text-danger-ink">
              Lo apartado no puede superar lo ingresado (
              {formatCents(props.incomeCents, { currency: props.currencyCode })}
              ).
            </p>
          ) : disponibleReal ? (
            <p
              className={`mt-1 text-[12px] ${exceedsReal ? "text-danger-ink" : "text-mute"}`}
            >
              {disponibleReal}
            </p>
          ) : null}
        </div>
      ) : null}
      <fieldset className="space-y-2">
        <legend className="text-[13px] text-mute">¿A qué se destina?</legend>
        {MODE_OPTIONS.map((option) => (
          <label
            key={option.mode}
            className={`flex cursor-pointer items-center gap-2 rounded-[14px] border p-3 text-sm ${
              props.reservedMode === option.mode
                ? "border-qp bg-qp-panel"
                : "border-line bg-card"
            }`}
          >
            <input
              type="radio"
              name="wizard-reserved-mode"
              className="accent-[var(--qp)]"
              checked={props.reservedMode === option.mode}
              onChange={() => props.onModeChange(option.mode)}
            />
            {option.label}
          </label>
        ))}
      </fieldset>
      {props.reservedMode === "existing" ? (
        <div>
          <Label htmlFor="wizard-reserved-commitment">Compromiso</Label>
          <select
            id="wizard-reserved-commitment"
            className="mt-1.5 w-full rounded-md border border-line bg-canvas px-3 py-2 text-sm"
            value={props.commitmentId}
            onChange={(event) => props.onCommitmentChange(event.target.value)}
          >
            <option value="">Elige un compromiso…</option>
            {props.commitments.map((commitment) => (
              <option key={commitment.id} value={commitment.id}>
                {commitment.name} ·{" "}
                {formatCents(commitment.amount, {
                  currency: props.currencyCode,
                })}
              </option>
            ))}
          </select>
        </div>
      ) : null}
      {props.reservedMode === "create" ? (
        <div className="space-y-2">
          <div>
            <Label htmlFor="wizard-new-name">Nombre</Label>
            <Input
              id="wizard-new-name"
              className="mt-1.5"
              placeholder="Cuota auto"
              value={props.newCommitment.name}
              onChange={(event) =>
                props.onNewCommitmentChange({
                  ...props.newCommitment,
                  name: event.target.value,
                })
              }
            />
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="wizard-new-amount">Cuota</Label>
              <Input
                id="wizard-new-amount"
                className="mt-1.5"
                inputMode="decimal"
                placeholder="0.00"
                value={props.reservedText}
                readOnly
              />
            </div>
            <div className="w-24">
              <Label htmlFor="wizard-new-dueday">Día de pago</Label>
              <Input
                id="wizard-new-dueday"
                className="mt-1.5"
                inputMode="numeric"
                value={props.newCommitment.dueDay || ""}
                onChange={(event) =>
                  props.onNewCommitmentChange({
                    ...props.newCommitment,
                    dueDay: Number(event.target.value) || 0,
                  })
                }
              />
            </div>
          </div>
        </div>
      ) : null}
      <div className="flex gap-2 pt-2">
        <Button variant="outline" className="flex-1" onClick={props.onBack}>
          Atrás
        </Button>
        <Button
          className="flex-1"
          disabled={!canContinue}
          onClick={props.onNext}
        >
          Continuar
        </Button>
      </div>
    </div>
  );
}
