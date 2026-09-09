"use client";

import { Check } from "reicon-react/icons/Check";
import { Button } from "@/shared/components/ui/button";
import { ENVELOPE_LABELS } from "@/shared/constants/envelopes";
import { formatCents } from "@/shared/lib/money";
import {
  ENVELOPE_EXPENSE_STYLES,
  EXPENSE_REMAINING_PREFIX,
  EXPENSE_REMAINING_SUFFIX,
  EXPENSE_SUCCESS_ELAPSED,
  EXPENSE_SUCCESS_ELAPSED_SUFFIX,
  EXPENSE_SUCCESS_TITLE,
} from "../constants";
import { buildDailyImpactLine } from "../lib/dailyImpactCopy";
import type { ExpenseEnvelopeType } from "../lib/envelopeSuggestion";
import { formatElapsedSeconds } from "../lib/keypad";

type Props = {
  amountCents: number;
  envelopeType: ExpenseEnvelopeType;
  remainingAmount: number;
  dailyDeltaCents: number;
  dailyAfterCents: number;
  daysRemainingInCycle: number;
  currencyCode: string;
  startedAt: number;
  onClose: () => void;
};

export function ExpenseConfirmation({
  amountCents,
  envelopeType,
  remainingAmount,
  dailyDeltaCents,
  dailyAfterCents,
  daysRemainingInCycle,
  currencyCode,
  startedAt,
  onClose,
}: Props) {
  const styles = ENVELOPE_EXPENSE_STYLES[envelopeType];
  const elapsed = formatElapsedSeconds(startedAt, Date.now());
  const displayRemaining = Math.max(0, remainingAmount);
  const impactLine = buildDailyImpactLine(
    {
      amountCents,
      envelopeType,
      dailyDeltaCents,
      dailyAfterCents,
      daysRemainingInCycle,
    },
    currencyCode,
  );

  return (
    <div className="px-2 py-4 text-center">
      <div className="mx-auto mb-5 flex size-[72px] items-center justify-center rounded-full bg-qp shadow-[0_14px_34px_-14px_var(--qp-shadow-strong)]">
        <Check size={18} color="var(--qp-canvas)" strokeWidth={3} aria-hidden />
      </div>

      <h3 className="font-serif text-[26px] font-medium text-ink">
        {EXPENSE_SUCCESS_TITLE}
      </h3>

      <p className="mt-2 text-[14.5px] text-mute">
        {formatCents(amountCents, { currency: currencyCode })} salió de{" "}
        <span className={`font-semibold ${styles.hintText}`}>
          {ENVELOPE_LABELS[envelopeType]}
        </span>
        .
      </p>

      <div className="mt-5 flex items-center justify-center gap-2 rounded-[12px] border border-line bg-surface-soft px-3 py-3 text-[13.5px] text-ink-secondary">
        {EXPENSE_REMAINING_PREFIX}{" "}
        <span className="font-serif text-base text-ink">
          {formatCents(displayRemaining, { currency: currencyCode })}
        </span>{" "}
        en {ENVELOPE_LABELS[envelopeType]} {EXPENSE_REMAINING_SUFFIX}
      </div>

      <p className="mt-2 text-[13px] leading-snug text-mute">{impactLine}</p>

      <p className="mt-5 font-mono text-[10.5px] tracking-wide text-mute/80 uppercase">
        {EXPENSE_SUCCESS_ELAPSED} {elapsed} {EXPENSE_SUCCESS_ELAPSED_SUFFIX}
      </p>

      <Button
        type="button"
        onClick={onClose}
        className="mt-6 h-11 w-full rounded-[12px] bg-ink text-sm font-semibold text-canvas hover:bg-ink/90"
      >
        Listo
      </Button>
    </div>
  );
}
