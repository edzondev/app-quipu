"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel";
import { fromConvexError } from "@/core/errors";
import { SettingsAccountActionButton } from "@/modules/settings/components/settings-account-action-button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog";
import { Button } from "@/shared/components/ui/button";
import { withPending } from "@/shared/lib/with-pending";
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
  ESPACIOS_MENU_CLOSE,
  ESPACIOS_MENU_LEAVE,
  ESPACIOS_SETTINGS_DANGER,
} from "../constants";
import { canEditSpaceSettingsSection } from "../lib/space-settings-permissions";
import type { SpaceSettings } from "../queries";
import { SpaceSection } from "./space-section";

type Props = {
  spaceId: Id<"financialSpaces">;
  settings: SpaceSettings;
};

type DialogMode = "close" | "leave" | null;

export function SpaceSettingsDangerSection({ spaceId, settings }: Props) {
  const router = useRouter();
  const closeSpace = useCloseSpace();
  const leaveSpace = useLeaveSpace();
  const [dialog, setDialog] = useState<DialogMode>(null);
  const [pending, setPending] = useState(false);

  const canClose = canEditSpaceSettingsSection(
    settings.viewerRole,
    settings.space.status,
    "close",
  );
  const canLeave = canEditSpaceSettingsSection(
    settings.viewerRole,
    settings.space.status,
    "leave",
  );

  if (!canClose && !canLeave) return null;

  async function handleConfirm() {
    if (!dialog) return;
    await withPending(setPending, async () => {
      try {
        if (dialog === "close") {
          await closeSpace({ spaceId });
          toast.success(ESPACIOS_CLOSE_SUCCESS);
        } else {
          await leaveSpace({ spaceId });
          toast.success(ESPACIOS_LEAVE_SUCCESS);
        }
        setDialog(null);
        router.push("/espacios");
        router.refresh();
      } catch (error) {
        toast.error(fromConvexError(error).message);
      }
    });
  }

  return (
    <>
      <SpaceSection
        title={ESPACIOS_SETTINGS_DANGER}
        className="border-danger/20"
        contentClassName="py-4"
      >
        <div className="flex flex-col gap-2">
          {canClose ? (
            <SettingsAccountActionButton
              tone="danger"
              onClick={() => setDialog("close")}
            >
              {ESPACIOS_MENU_CLOSE}
            </SettingsAccountActionButton>
          ) : null}
          {canLeave ? (
            <SettingsAccountActionButton
              tone="danger"
              onClick={() => setDialog("leave")}
            >
              {ESPACIOS_MENU_LEAVE}
            </SettingsAccountActionButton>
          ) : null}
        </div>
      </SpaceSection>

      <AlertDialog
        open={dialog !== null}
        onOpenChange={(open) => {
          if (!open) setDialog(null);
        }}
      >
        <AlertDialogContent className="rounded-[22px] border-t-4 border-t-danger">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif">
              {dialog === "close" ? ESPACIOS_CLOSE_TITLE : ESPACIOS_LEAVE_TITLE}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {dialog === "close" ? ESPACIOS_CLOSE_BODY : ESPACIOS_LEAVE_BODY}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancelar</AlertDialogCancel>
            <Button
              onClick={handleConfirm}
              disabled={pending}
              className="bg-danger text-canvas hover:bg-danger/90"
            >
              {pending
                ? "Procesando…"
                : dialog === "close"
                  ? ESPACIOS_CLOSE_CONFIRM
                  : ESPACIOS_LEAVE_CONFIRM}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
