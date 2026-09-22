"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel";
import { fromConvexError } from "@/core/errors";
import { buttonVariants } from "@/shared/components/ui/button-variants";
import { cn } from "@/shared/lib/utils";
import { withFlag } from "@/shared/lib/with-pending";
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

function MemberInvitePanel({
  canManageInvites,
  spaceIsFull,
  pendingInvite,
  inviteLink,
  pendingAction,
  onRevoke,
  onGenerate,
}: {
  canManageInvites: boolean;
  spaceIsFull: boolean;
  pendingInvite: SpaceSettings["pendingInvitations"][number] | undefined;
  inviteLink: string | null;
  pendingAction: "generate" | Id<"spaceInvitations"> | null;
  onRevoke: (invitationId: Id<"spaceInvitations">) => void;
  onGenerate: () => void;
}) {
  if (!canManageInvites) return null;
  if (spaceIsFull) {
    return (
      <div className="mt-4 border-t border-line/50 pt-4">
        <p className="text-sm text-mute">{ESPACIOS_INVITE_FULL_BODY}</p>
      </div>
    );
  }
  if (!pendingInvite) {
    return (
      <div className="mt-4 border-t border-line/50 pt-4">
        <button
          type="button"
          className={cn(
            buttonVariants({ variant: "outline" }),
            "h-9 px-3 text-xs",
          )}
          disabled={pendingAction === "generate"}
          onClick={onGenerate}
        >
          {pendingAction === "generate"
            ? "Generando enlace…"
            : ESPACIOS_SETTINGS_INVITE_GENERATE}
        </button>
      </div>
    );
  }
  return (
    <div className="mt-4 border-t border-line/50 pt-4">
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
          onClick={() => onRevoke(pendingInvite._id)}
        >
          {pendingAction === pendingInvite._id
            ? "Revocando…"
            : ESPACIOS_SETTINGS_INVITE_REVOKE}
        </button>
      </div>
    </div>
  );
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
    await withFlag(setPendingAction, "generate", null, async () => {
      try {
        const { token } = await createInvitation({ spaceId });
        const origin =
          typeof window !== "undefined" ? window.location.origin : "";
        setInviteLink(`${origin}/espacios/unirse/${token}`);
        toast.success(ESPACIOS_SETTINGS_INVITE_GENERATED);
      } catch (error) {
        toast.error(fromConvexError(error).message);
      }
    });
  }

  async function handleRevoke(invitationId: Id<"spaceInvitations">) {
    await withFlag(setPendingAction, invitationId, null, async () => {
      try {
        await revokeInvitation({ invitationId });
        setInviteLink(null);
        toast.success(ESPACIOS_SETTINGS_INVITE_REVOKED);
      } catch (error) {
        toast.error(fromConvexError(error).message);
      }
    });
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

      <MemberInvitePanel
        canManageInvites={canManageInvites}
        spaceIsFull={spaceIsFull}
        pendingInvite={pendingInvite}
        inviteLink={inviteLink}
        pendingAction={pendingAction}
        onRevoke={handleRevoke}
        onGenerate={handleGenerateLink}
      />
    </SpaceSection>
  );
}
