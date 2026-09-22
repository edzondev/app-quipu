"use client";

import { useMutation } from "convex/react";
import { useCallback, useState, useTransition } from "react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { AnalyticsEvents, track } from "@/core/analytics";
import { DEFAULT_CURRENCY } from "@/core/constants";
import { fromConvexError } from "@/core/errors";
import type { IncomeSource } from "@/modules/income/types";
import { AnimatedView } from "@/shared/components/ui/animated-view";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Sheet, SheetContent, SheetTitle } from "@/shared/components/ui/sheet";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import { MovementDetailCard } from "./movement-detail-card";
import { MovementDetailConfirmDelete } from "./movement-detail-confirm-delete";
import { MovementDetailEditExpense } from "./movement-detail-edit-expense";
import { MovementDetailEditIncome } from "./movement-detail-edit-income";
import { MovementDetailSuccess } from "./movement-detail-success";

type EnvelopeType = "needs" | "wants";

export type MovementForDetail = {
  id: string;
  kind: "expense" | "income" | "contribution";
  label: string;
  amount: number;
  timestamp: number;
  isExtraordinaryIncome?: boolean;
  // Expense fields
  envelopeType?: EnvelopeType;
  // Income fields
  occurredAt?: number;
  source?: IncomeSource;
  incomeKind?: "habitual" | "extraordinary";
  extraordinaryType?: string;
  extraordinaryLabel?: string;
};

type SheetState =
  | "detail"
  | "edit-expense"
  | "edit-income"
  | "confirm-delete"
  | "success";

const SHEET_TITLES: Record<SheetState, string> = {
  detail: "Detalle del movimiento",
  "edit-expense": "Editar gasto",
  "edit-income": "Editar ingreso",
  "confirm-delete": "Eliminar movimiento",
  success: "Movimiento actualizado",
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  movement: MovementForDetail | null;
  currencyCode?: string;
};

type Direction = "forward" | "back";

/**
 * Sheet/dialog que muestra el detalle de un movimiento (gasto, ingreso o
 * aporte) y permite editarlo o eliminarlo. Cada vista vive en su propio
 * componente; aquí solo orquestamos estado, mutaciones y contenedor.
 */
export function MovementDetailSheet({
  open,
  onOpenChange,
  movement,
  currencyCode = DEFAULT_CURRENCY.code,
}: Props) {
  const isMobile = useIsMobile();
  const [state, setState] = useState<SheetState>("detail");
  const [direction, setDirection] = useState<Direction>("forward");
  const [isDeleting, startDelete] = useTransition();
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const goTo = useCallback(
    (next: SheetState, nextDirection: Direction = "forward") => {
      setDirection(nextDirection);
      setState(next);
    },
    [],
  );

  const resetOnClose = useCallback(() => {
    setDirection("forward");
    setState("detail");
    setDeleteError(null);
  }, []);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) resetOnClose();
      onOpenChange(nextOpen);
    },
    [onOpenChange, resetOnClose],
  );

  const deleteExpense = useMutation(api.expenses.deleteExpense);
  const deleteIncomeEvent = useMutation(api.incomeEvents.deleteIncomeEvent);

  const handleDelete = useCallback(() => {
    if (!movement) return;
    setDeleteError(null);
    const isIncome = movement.kind === "income";
    startDelete(async () => {
      try {
        if (isIncome) {
          await deleteIncomeEvent({
            eventId: movement.id as Id<"incomeEvents">,
          });
        } else {
          await deleteExpense({ expenseId: movement.id as Id<"expenses"> });
        }
        track(AnalyticsEvents.MOVEMENT_DELETED, {
          movement_kind: isIncome ? "income" : "expense",
          amount: movement.amount,
          preferred_correct_shown: isIncome,
        });
        onOpenChange(false);
      } catch (error) {
        setDeleteError(fromConvexError(error).message);
      }
    });
  }, [movement, deleteExpense, deleteIncomeEvent, onOpenChange]);

  const title = SHEET_TITLES[state];
  const body =
    movement &&
    renderBody({
      state,
      movement,
      currencyCode,
      isDeleting,
      deleteError,
      goTo,
      onClose: () => handleOpenChange(false),
      onConfirmDelete: () => void handleDelete(),
      onCancelDelete: () => {
        goTo("detail", "back");
        setDeleteError(null);
      },
    });

  const animatedBody = body ? (
    <AnimatedView
      viewKey={state}
      direction={direction}
      aria-labelledby="movement-sheet-title"
    >
      {body}
    </AnimatedView>
  ) : null;

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent
          side="bottom"
          showCloseButton
          className="flex max-h-[92dvh] flex-col gap-0 overflow-hidden rounded-t-[24px] border-line bg-card px-5 pb-0 pt-3"
        >
          <div className="mx-auto mb-4 h-1 w-10 shrink-0 rounded-full bg-line" />
          <SheetTitle
            id="movement-sheet-title"
            className="mb-4 shrink-0 pr-8 text-[15px] font-semibold text-ink"
          >
            {title}
          </SheetTitle>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[max(env(safe-area-inset-bottom),20px)]">
            {animatedBody}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[400px] gap-0 rounded-[22px] border-line bg-card p-0">
        <DialogTitle
          id="movement-sheet-title"
          className="px-5 pt-5 pr-12 text-[15px] font-semibold text-ink"
        >
          {title}
        </DialogTitle>
        <div className="max-h-[min(85vh,720px)] overflow-y-auto px-5 pb-5 pt-4">
          {animatedBody}
        </div>
      </DialogContent>
    </Dialog>
  );
}

type RenderBodyArgs = {
  state: SheetState;
  movement: MovementForDetail;
  currencyCode: string;
  isDeleting: boolean;
  deleteError: string | null;
  goTo: (next: SheetState, direction?: Direction) => void;
  onClose: () => void;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
};

function renderBody({
  state,
  movement,
  currencyCode,
  isDeleting,
  deleteError,
  goTo,
  onClose,
  onConfirmDelete,
  onCancelDelete,
}: RenderBodyArgs) {
  switch (state) {
    case "success":
      return <MovementDetailSuccess onClose={onClose} />;
    case "confirm-delete":
      return (
        <MovementDetailConfirmDelete
          isIncome={movement.kind === "income"}
          isDeleting={isDeleting}
          deleteError={deleteError}
          onCancel={onCancelDelete}
          onConfirm={onConfirmDelete}
          onCloseSheet={onClose}
        />
      );
    case "edit-expense":
      if (movement.kind !== "expense") return null;
      return (
        <MovementDetailEditExpense
          movement={movement}
          currencyCode={currencyCode}
          onSuccess={() => goTo("success")}
          onCancel={() => goTo("detail", "back")}
        />
      );
    case "edit-income":
      if (movement.kind !== "income") return null;
      return (
        <MovementDetailEditIncome
          movement={movement}
          currencyCode={currencyCode}
          onSuccess={() => goTo("success")}
          onCancel={() => goTo("detail", "back")}
        />
      );
    default:
      return (
        <MovementDetailCard
          movement={movement}
          currencyCode={currencyCode}
          onEdit={() =>
            goTo(movement.kind === "income" ? "edit-income" : "edit-expense")
          }
          onRequestDelete={() => goTo("confirm-delete")}
        />
      );
  }
}

// (Type already exported above as `MovementForDetail`.)
