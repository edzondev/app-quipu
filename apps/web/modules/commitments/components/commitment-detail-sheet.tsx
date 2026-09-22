"use client";

import { useMutation } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { fromConvexError } from "@/core/errors";
import { ConfirmDestructiveDialog } from "@/shared/components/confirm-destructive-dialog";
import { AnimatedView } from "@/shared/components/ui/animated-view";
import { Button } from "@/shared/components/ui/button";
import { buttonVariants } from "@/shared/components/ui/button-variants";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Sheet, SheetContent, SheetTitle } from "@/shared/components/ui/sheet";
import {
  COMMITMENT_COVERAGE_LABEL,
  COMMITMENT_MARK_PAID,
  COMMITMENT_MARK_PAID_SUCCESS,
  COMMITMENT_NEXT_DUE_LABEL,
  COMMITMENT_PAYMENT_LABEL,
  formatDueInDays,
} from "@/shared/constants/commitments";
import { ENVELOPE_LABELS } from "@/shared/constants/envelopes";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import {
  formatCoverageStatusLabel,
  formatPaymentStatusLabel,
} from "@/shared/lib/commitmentStatusDisplay";
import { formatLimaDate } from "@/shared/lib/date";
import { formatCents } from "@/shared/lib/money";
import { cn } from "@/shared/lib/utils";

export type CommitmentForDetail = {
  id: string;
  name: string;
  amount: number;
  envelope: "needs" | "wants";
  nextDueAt: number;
  daysUntilDue: number;
  coverageStatus: "covered" | "partial" | "uncovered";
  paymentStatus?: "paid" | "pending" | "overdue";
  paidAtForCycle?: number;
};

type Props = {
  commitment: CommitmentForDetail | null;
  currencyCode: string;
  hasActiveCycle: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

async function runMutationWithBusyFlag(
  setBusy: (busy: boolean) => void,
  run: () => Promise<unknown>,
): Promise<string | null> {
  setBusy(true);
  try {
    await run();
    return null;
  } catch (error) {
    return fromConvexError(error).message;
  } finally {
    setBusy(false);
  }
}

export function CommitmentDetailSheet({
  commitment,
  currencyCode,
  hasActiveCycle,
  open,
  onOpenChange,
}: Props) {
  const isMobile = useIsMobile();
  const deleteCommitment = useMutation(
    api.fixedCommitments.deleteFixedCommitment,
  );
  const markAsPaid = useMutation(api.fixedCommitments.markCommitmentAsPaid);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [isMarkingPaid, setIsMarkingPaid] = useState(false);

  async function handleMarkAsPaid() {
    if (!commitment) return;
    const errorMessage = await runMutationWithBusyFlag(
      setIsMarkingPaid,
      async () => {
        await markAsPaid({
          commitmentId: commitment.id as Id<"fixedCommitments">,
        });
        toast.success(COMMITMENT_MARK_PAID_SUCCESS);
      },
    );
    if (errorMessage) {
      toast.error(errorMessage);
    }
  }

  async function handleDelete() {
    if (!commitment) return;
    const errorMessage = await runMutationWithBusyFlag(setPending, async () => {
      await deleteCommitment({
        commitmentId: commitment.id as Id<"fixedCommitments">,
      });
      toast.success("Compromiso eliminado.");
      setConfirmOpen(false);
      onOpenChange(false);
    });
    if (errorMessage) {
      toast.error(errorMessage);
    }
  }

  const title = commitment?.name ?? "Compromiso";
  const titleId = "commitment-detail-sheet-title";
  const contentKey = commitment?.id ?? "empty";

  const body = commitment ? (
    <>
      <dl className="space-y-3 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-[12.5px] font-medium text-ink-secondary">
            Monto
          </dt>
          <dd className="font-serif text-lg text-ink">
            {formatCents(commitment.amount, {
              currency: currencyCode,
            })}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-[12.5px] font-medium text-ink-secondary">
            Sobre
          </dt>
          <dd className="font-medium text-ink">
            {ENVELOPE_LABELS[commitment.envelope]}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-[12.5px] font-medium text-ink-secondary">
            {COMMITMENT_NEXT_DUE_LABEL}
          </dt>
          <dd className="text-right font-medium text-ink">
            <div>{formatLimaDate(commitment.nextDueAt)}</div>
            {commitment.paymentStatus !== "paid" ? (
              <div className="text-xs font-normal text-mute">
                {formatDueInDays(commitment.daysUntilDue)}
              </div>
            ) : null}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-[12.5px] font-medium text-ink-secondary">
            {COMMITMENT_COVERAGE_LABEL}
          </dt>
          <dd className="font-medium text-ink">
            {formatCoverageStatusLabel(commitment.coverageStatus)}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-[12.5px] font-medium text-ink-secondary">
            {COMMITMENT_PAYMENT_LABEL}
          </dt>
          <dd
            className={cn(
              "font-medium",
              commitment.paymentStatus === "paid"
                ? "text-qp-deep"
                : commitment.paymentStatus === "overdue"
                  ? "text-danger-ink"
                  : "text-ink",
            )}
          >
            {formatPaymentStatusLabel(
              commitment.paymentStatus ?? "pending",
              commitment.paidAtForCycle,
              commitment.daysUntilDue,
            )}
          </dd>
        </div>
      </dl>
      <div className="mt-6 space-y-2.5">
        {hasActiveCycle && commitment.paymentStatus !== "paid" ? (
          <Button
            type="button"
            disabled={isMarkingPaid}
            onClick={() => void handleMarkAsPaid()}
            className="h-12 w-full rounded-[12px] bg-ink text-[15px] font-semibold text-canvas hover:bg-ink/90"
          >
            {isMarkingPaid ? "Guardando…" : COMMITMENT_MARK_PAID}
          </Button>
        ) : null}
        <button
          type="button"
          className={cn(
            buttonVariants({ variant: "outline" }),
            "h-12 w-full border-danger-line text-danger-ink hover:bg-danger-banner",
          )}
          onClick={() => setConfirmOpen(true)}
        >
          Eliminar compromiso
        </button>
      </div>
    </>
  ) : null;

  return (
    <>
      {isMobile ? (
        <Sheet open={open} onOpenChange={onOpenChange}>
          <SheetContent
            side="bottom"
            showCloseButton
            className="flex max-h-[92dvh] flex-col gap-0 overflow-hidden rounded-t-[24px] border-line bg-card px-5 pb-[max(env(safe-area-inset-bottom),20px)] pt-3"
          >
            <div className="mx-auto mb-4 h-1 w-10 shrink-0 rounded-full bg-line" />
            <SheetTitle
              id={titleId}
              className="mb-4 shrink-0 pr-8 font-serif text-xl text-ink"
            >
              {title}
            </SheetTitle>
            <AnimatedView viewKey={contentKey} aria-labelledby={titleId}>
              {body}
            </AnimatedView>
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="max-w-[400px] gap-0 rounded-[22px] border-line bg-card p-0">
            <DialogTitle
              id={titleId}
              className="px-5 pt-5 pr-12 font-serif text-xl text-ink"
            >
              {title}
            </DialogTitle>
            <AnimatedView
              viewKey={contentKey}
              aria-labelledby={titleId}
              className="px-5 pb-5 pt-4"
            >
              {body}
            </AnimatedView>
          </DialogContent>
        </Dialog>
      )}
      <ConfirmDestructiveDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="¿Eliminar este compromiso?"
        description="Se quitará de tu ciclo. Los ingresos ya registrados no cambian."
        confirmLabel="Eliminar"
        pending={pending}
        onConfirm={() => void handleDelete()}
      />
    </>
  );
}
