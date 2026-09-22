"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel";
import { fromConvexError } from "@/core/errors";
import { ConfirmDestructiveDialog } from "@/shared/components/confirm-destructive-dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover";
import { cn } from "@/shared/lib/utils";
import { useCloseSpace, useLeaveSpace } from "../actions";
import {
  ESPACIOS_CLOSE_BODY,
  ESPACIOS_CLOSE_CONFIRM,
  ESPACIOS_CLOSE_SUCCESS,
  ESPACIOS_CLOSE_TITLE,
  ESPACIOS_LEAVE_BODY,
  ESPACIOS_LEAVE_CONFIRM,
  ESPACIOS_LEAVE_SUCCESS,
  ESPACIOS_LEAVE_TITLE,
  ESPACIOS_MENU_ACTIONS,
  ESPACIOS_MENU_CLOSE,
  ESPACIOS_MENU_LEAVE,
  ESPACIOS_MENU_SETTINGS,
} from "../constants";
import { formatSpaceAllocationSummary } from "../lib/space-status-labels";

type Props = {
  spaceId: Id<"financialSpaces">;
  name: string;
  allocationNeeds: number;
  allocationWants: number;
  allocationSavings: number;
  viewerRole: "owner" | "member";
  status: "active" | "readonly" | "closed";
};

function menuItemClassName(destructive = false) {
  return cn(
    "flex w-full min-h-11 items-center rounded-[9px] px-3 py-2 text-left text-sm font-medium transition-colors",
    destructive
      ? "text-danger-ink hover:bg-danger-bg"
      : "text-ink hover:bg-surface-warm",
  );
}

export function SpaceDashboardHeader({
  spaceId,
  name,
  allocationNeeds,
  allocationWants,
  allocationSavings,
  viewerRole,
  status,
}: Props) {
  const router = useRouter();
  const closeSpace = useCloseSpace();
  const leaveSpace = useLeaveSpace();
  const [menuOpen, setMenuOpen] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [closePending, startClose] = useTransition();
  const [leavePending, startLeave] = useTransition();

  const showClose = viewerRole === "owner" && status !== "closed";
  const showLeave = viewerRole === "member";

  function handleClose() {
    startClose(async () => {
      try {
        await closeSpace({ spaceId });
        toast.success(ESPACIOS_CLOSE_SUCCESS);
        setCloseOpen(false);
        router.push("/espacios");
      } catch (error) {
        toast.error(fromConvexError(error).message);
      }
    });
  }

  function handleLeave() {
    startLeave(async () => {
      try {
        await leaveSpace({ spaceId });
        toast.success(ESPACIOS_LEAVE_SUCCESS);
        setLeaveOpen(false);
        router.push("/espacios");
      } catch (error) {
        toast.error(fromConvexError(error).message);
      }
    });
  }

  return (
    <>
      <div className="mt-5 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="font-serif text-[26px] font-medium tracking-tight text-ink">
            {name}
          </h1>
          <p className="mt-1 text-[13px] text-mute">
            {formatSpaceAllocationSummary(
              allocationNeeds,
              allocationWants,
              allocationSavings,
            )}
          </p>
        </div>
        <Popover open={menuOpen} onOpenChange={setMenuOpen}>
          <PopoverTrigger
            aria-label={ESPACIOS_MENU_ACTIONS}
            className={cn(
              "inline-flex size-10 shrink-0 items-center justify-center rounded-lg border border-line/70 bg-card text-base leading-none text-ink-secondary transition-colors",
              "hover:border-line hover:bg-surface-warm hover:text-ink",
            )}
          >
            ···
          </PopoverTrigger>
          <PopoverContent align="end" className="w-56 gap-1 p-1.5">
            <Link
              href={`/espacios/${spaceId}/configuracion`}
              className={menuItemClassName()}
              onClick={() => setMenuOpen(false)}
            >
              {ESPACIOS_MENU_SETTINGS}
            </Link>
            {showClose ? (
              <button
                type="button"
                className={menuItemClassName(true)}
                onClick={() => {
                  setMenuOpen(false);
                  setCloseOpen(true);
                }}
              >
                {ESPACIOS_MENU_CLOSE}
              </button>
            ) : null}
            {showLeave ? (
              <button
                type="button"
                className={menuItemClassName(true)}
                onClick={() => {
                  setMenuOpen(false);
                  setLeaveOpen(true);
                }}
              >
                {ESPACIOS_MENU_LEAVE}
              </button>
            ) : null}
          </PopoverContent>
        </Popover>
      </div>

      <ConfirmDestructiveDialog
        open={closeOpen}
        onOpenChange={setCloseOpen}
        title={ESPACIOS_CLOSE_TITLE}
        description={ESPACIOS_CLOSE_BODY}
        confirmLabel={ESPACIOS_CLOSE_CONFIRM}
        pending={closePending}
        onConfirm={() => void handleClose()}
      />
      <ConfirmDestructiveDialog
        open={leaveOpen}
        onOpenChange={setLeaveOpen}
        title={ESPACIOS_LEAVE_TITLE}
        description={ESPACIOS_LEAVE_BODY}
        confirmLabel={ESPACIOS_LEAVE_CONFIRM}
        pending={leavePending}
        onConfirm={() => void handleLeave()}
      />
    </>
  );
}
