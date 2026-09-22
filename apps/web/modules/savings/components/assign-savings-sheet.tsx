"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { fromConvexError } from "@/core/errors";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { formatCents } from "@/shared/lib/money";
import { cn } from "@/shared/lib/utils";
import { withPending } from "@/shared/lib/with-pending";
import {
  assignSavingsEnvelope as assignSavingsEnvelopeAction,
  useAssignSavingsEnvelope,
} from "../actions";
import {
  ASSIGN_SHEET_AVAILABLE_PREFIX,
  ASSIGN_SHEET_CONFIRM_CTA,
  ASSIGN_SHEET_DISMISS,
  ASSIGN_SHEET_LINE_HINT_PREFIX,
  ASSIGN_SHEET_RATIONALE,
  ASSIGN_SHEET_SUCCESS_PREFIX,
  ASSIGN_SHEET_TITLE,
  ASSIGN_SHEET_TOTAL_LABEL,
} from "../constants";
import { parseOptionalTargetCents } from "../lib/savingsCopy";
import type { SavingsOverview } from "../types";
import { SavingsFormShell } from "./savings-form-shell";

type Plan = NonNullable<SavingsOverview["assignPlan"]>;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableCents: number;
  currencyCode: string;
  plan: Plan | null;
};

function toSolesInput(cents: number): string {
  return String(cents / 100);
}

export function AssignSavingsSheet({
  open,
  onOpenChange,
  availableCents,
  currencyCode,
  plan,
}: Props) {
  const assign = useAssignSavingsEnvelope();
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [seeded, setSeeded] = useState<{ open: boolean; plan: Plan | null }>({
    open: false,
    plan: null,
  });

  if (open !== seeded.open || plan !== seeded.plan) {
    setSeeded({ open, plan });
    if (open && plan) {
      setAmounts(
        Object.fromEntries(
          plan.lines.map((line) => [
            line.subEnvelopeId,
            toSolesInput(line.suggestedCents),
          ]),
        ),
      );
    }
  }

  const lines = useMemo(() => plan?.lines ?? [], [plan]);
  const rationale = plan ? ASSIGN_SHEET_RATIONALE[plan.rationale] : null;

  const parsedLines = lines.map((line) => {
    const raw = amounts[line.subEnvelopeId] ?? "";
    const trimmed = raw.trim();
    const amountCents =
      trimmed === "" ? 0 : (parseOptionalTargetCents(trimmed) ?? -1);
    return { ...line, amountCents };
  });
  const includedLines = parsedLines.filter((line) => line.amountCents !== 0);
  const totalCents = includedLines.reduce(
    (sum, line) => sum + Math.max(0, line.amountCents),
    0,
  );
  const hasInvalidLine = parsedLines.some((line) => line.amountCents < 0);
  const canSubmit =
    !hasInvalidLine &&
    includedLines.length > 0 &&
    totalCents > 0 &&
    totalCents <= availableCents;

  async function handleSubmit() {
    if (!canSubmit) return;
    await withPending(setIsSubmitting, async () => {
      try {
        const result = await assignSavingsEnvelopeAction(assign, {
          lines: includedLines.map((line) => ({
            subEnvelopeId: line.subEnvelopeId,
            amountCents: line.amountCents,
          })),
        });
        toast.success(
          `${ASSIGN_SHEET_SUCCESS_PREFIX} Asignaste ${formatCents(result.assignedCents, { currency: currencyCode })} a ${result.results.length} ${result.results.length === 1 ? "destino" : "destinos"}.`,
        );
        onOpenChange(false);
      } catch (error) {
        toast.error(fromConvexError(error).message);
      }
    });
  }

  return (
    <SavingsFormShell
      open={open}
      onOpenChange={onOpenChange}
      title={ASSIGN_SHEET_TITLE}
    >
      <p className="text-[12.5px] text-mute">
        {ASSIGN_SHEET_AVAILABLE_PREFIX}{" "}
        {formatCents(availableCents, { currency: currencyCode })}
      </p>
      {rationale ? (
        <p className="mt-1 text-[12.5px] text-qp-deep">{rationale}</p>
      ) : null}

      <div className="mt-4 space-y-3">
        {parsedLines.map((line) => {
          const isInvalid = line.amountCents < 0;
          return (
            <div key={line.subEnvelopeId}>
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-[13.5px] font-medium text-ink">
                    {line.label}
                  </p>
                  {line.remainingToTargetCents > 0 ? (
                    <p className="text-[12px] text-mute-subtle">
                      {ASSIGN_SHEET_LINE_HINT_PREFIX}{" "}
                      {formatCents(line.remainingToTargetCents, {
                        currency: currencyCode,
                      })}
                    </p>
                  ) : null}
                </div>
                <Input
                  inputMode="decimal"
                  className="w-28 text-right"
                  value={amounts[line.subEnvelopeId] ?? ""}
                  onChange={(event) =>
                    setAmounts((prev) => ({
                      ...prev,
                      [line.subEnvelopeId]: event.target.value,
                    }))
                  }
                  aria-invalid={isInvalid}
                  aria-label={line.label}
                />
              </div>
              {isInvalid ? (
                <p className="mt-1 text-[12px] text-danger-text">
                  Ingresa un monto válido.
                </p>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-between rounded-xl border border-line bg-surface-soft px-3 py-2.5">
        <span className="text-[12.5px] font-medium text-ink-secondary">
          {ASSIGN_SHEET_TOTAL_LABEL}
        </span>
        <span
          className={cn(
            "text-[13.5px] font-semibold",
            totalCents > availableCents || hasInvalidLine
              ? "text-danger-ink"
              : "text-qp-deep",
          )}
        >
          {formatCents(Math.max(0, totalCents), { currency: currencyCode })}
        </span>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        <Button
          type="button"
          disabled={!canSubmit || isSubmitting}
          onClick={() => void handleSubmit()}
        >
          {ASSIGN_SHEET_CONFIRM_CTA}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
        >
          {ASSIGN_SHEET_DISMISS}
        </Button>
      </div>
    </SavingsFormShell>
  );
}
