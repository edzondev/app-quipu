"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel";
import { fromConvexError } from "@/core/errors";
import { buttonVariants } from "@/shared/components/ui/button-variants";
import { cn } from "@/shared/lib/utils";
import { useCreateInvitation, useRevokeInvitation } from "../actions";
import {
  ESPACIOS_INVITE_FULL_BODY,
  ESPACIOS_SETTINGS_INVITE_GENERATE,
  ESPACIOS_SETTINGS_INVITE_GENERATED,
  ESPACIOS_SETTINGS_INVITE_PENDING,
  ESPACIOS_SETTINGS_INVITE_REVOKE,
  ESPACIOS_SETTINGS_INVITE_REVOKED,
  ESPACIOS_SETTINGS_MEMBER_PLACEHOLDER,
  ESPACIOS_SETTINGS_MEMBERS,
} from "../constants";
import { canEditSpaceSettingsSection } from "../lib/space-settings-permissions";
import { formatSpaceRole } from "../lib/space-status-labels";
import type { SpaceSettings } from "../queries";
import { SpaceSection } from "./space-section";

type Props = {
  spaceId: Id<"financialSpaces">;
  settings: SpaceSettings;
};

const inviteExpiryFormatter = new Intl.DateTimeFormat("es-PE", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "America/Lima",
});

function formatInviteExpiry(expiresAt: number): string {
  return inviteExpiryFormatter.format(expiresAt);
}

export function SpaceSettingsMembersSection({ spaceId, settings }: Props) {
  const createInvitation = useCreateInvitation();
  const revokeInvitation = useRevokeInvitation();
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<
    "generate" | Id<"spaceInvitations"> | null
  >(null);

  const canManageInvites = canEditSpaceSettingsSection(
    settings.viewerRole,
    settings.space.status,
    "members",
    { isWritable: settings.isWritable },
  );
  const spaceIsFull = settings.members.length >= 2;
  const pendingInvite = settings.pendingInvitations[0];

  async function handleGenerateLink() {
    setPendingAction("generate");
    try {
      const { token } = await createInvitation({ spaceId });
      const origin =
        typeof window !== "undefined" ? window.location.origin : "";
      setInviteLink(`${origin}/espacios/unirse/${token}`);
      toast.success(ESPACIOS_SETTINGS_INVITE_GENERATED);
    } catch (error) {
      toast.error(fromConvexError(error).message);
    }
    setPendingAction(null);
  }

  async function handleRevoke(invitationId: Id<"spaceInvitations">) {
    setPendingAction(invitationId);
    try {
      await revokeInvitation({ invitationId });
      setInviteLink(null);
      toast.success(ESPACIOS_SETTINGS_INVITE_REVOKED);
    } catch (error) {
      toast.error(fromConvexError(error).message);
    }
    setPendingAction(null);
  }

  return (
    <SpaceSection title={ESPACIOS_SETTINGS_MEMBERS}>
      <ul className="space-y-2.5">
        {settings.members.map((member) => (
          <li
            key={member.profileId}
            className="flex items-center justify-between gap-3 rounded-lg bg-surface-warm/40 px-3 py-2.5 text-sm"
          >
            <span className="font-medium text-ink">{member.name}</span>
            <span className="text-[12px] text-mute">
              {formatSpaceRole(member.role)}
            </span>
          </li>
        ))}
        {settings.members.length < 2 ? (
          <li className="px-1 text-sm text-mute">
            {ESPACIOS_SETTINGS_MEMBER_PLACEHOLDER}
          </li>
        ) : null}
      </ul>

      {canManageInvites ? (
        <div className="mt-4 border-t border-line/50 pt-4">
          {spaceIsFull ? (
            <p className="text-sm text-mute">{ESPACIOS_INVITE_FULL_BODY}</p>
          ) : pendingInvite ? (
            <div className="space-y-3">
              <p className="text-sm text-mute">
                {ESPACIOS_SETTINGS_INVITE_PENDING} · vence el{" "}
                {formatInviteExpiry(pendingInvite.expiresAt)}
              </p>
              {inviteLink ? (
                <p className="break-all rounded-lg bg-canvas px-3 py-2 text-xs text-ink">
                  {inviteLink}
                </p>
              ) : null}
              <button
                type="button"
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "h-9 px-3 text-xs",
                )}
                disabled={pendingAction !== null}
                onClick={() => handleRevoke(pendingInvite._id)}
              >
                {pendingAction === pendingInvite._id
                  ? "Revocando…"
                  : ESPACIOS_SETTINGS_INVITE_REVOKE}
              </button>
            </div>
          ) : (
            <button
              type="button"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "h-9 px-3 text-xs",
              )}
              disabled={pendingAction === "generate"}
              onClick={handleGenerateLink}
            >
              {pendingAction === "generate"
                ? "Generando enlace…"
                : ESPACIOS_SETTINGS_INVITE_GENERATE}
            </button>
          )}
        </div>
      ) : null}
    </SpaceSection>
  );
}
