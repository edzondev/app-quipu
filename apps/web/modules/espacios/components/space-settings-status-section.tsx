"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel";
import { AnalyticsEvents, track } from "@/core/analytics";
import { fromConvexError } from "@/core/errors";
import { PremiumLockCard } from "@/shared/components/premium-lock-card";
import { buttonVariants } from "@/shared/components/ui/button-variants";
import { cn } from "@/shared/lib/utils";
import { withPending } from "@/shared/lib/with-pending";
import { useReactivateSpace } from "../actions";
import {
  ESPACIOS_READONLY_REACTIVATE_HINT,
  ESPACIOS_SETTINGS_REACTIVATE,
  ESPACIOS_SETTINGS_REACTIVATED,
  ESPACIOS_SETTINGS_STATUS,
} from "../constants";
import { canEditSpaceSettingsSection } from "../lib/space-settings-permissions";
import {
  formatSpaceStatus,
  spaceStatusBadgeClass,
} from "../lib/space-status-labels";
import type { SpaceSettings } from "../queries";
import { SpaceSection } from "./space-section";

type Props = {
  spaceId: Id<"financialSpaces">;
  settings: SpaceSettings;
};

export function SpaceSettingsStatusSection({ spaceId, settings }: Props) {
  const reactivate = useReactivateSpace();
  const [pending, setPending] = useState(false);

  const canReactivate = canEditSpaceSettingsSection(
    settings.viewerRole,
    settings.space.status,
    "reactivate",
    { canReactivate: settings.canReactivate },
  );

  async function handleReactivate() {
    await withPending(setPending, async () => {
      try {
        await reactivate({ spaceId });
        track(AnalyticsEvents.SPACE_REACTIVATED, { space_id: spaceId });
        toast.success(ESPACIOS_SETTINGS_REACTIVATED);
      } catch (error) {
        toast.error(fromConvexError(error).message);
      }
    });
  }

  return (
    <SpaceSection
      title={ESPACIOS_SETTINGS_STATUS}
      titleAside={
        <span
          className={cn(
            "rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
            spaceStatusBadgeClass(settings.space.status),
          )}
        >
          {formatSpaceStatus(settings.space.status)}
        </span>
      }
    >
      {settings.space.status === "readonly" ? (
        <div className="space-y-3">
          <p className="text-sm leading-relaxed text-mute">
            {ESPACIOS_READONLY_REACTIVATE_HINT}
          </p>
          {canReactivate ? (
            <button
              type="button"
              className={cn(
                buttonVariants({ variant: "default" }),
                "h-9 px-3 text-xs",
              )}
              disabled={pending}
              onClick={handleReactivate}
            >
              {pending ? "Reactivando…" : ESPACIOS_SETTINGS_REACTIVATE}
            </button>
          ) : settings.viewerRole === "owner" && !settings.ownerIsPremium ? (
            <PremiumLockCard
              title="Reactiva tu espacio compartido"
              body={ESPACIOS_READONLY_REACTIVATE_HINT}
              currencyCode={settings.space.currencyCode}
              espaciosPaywallSurface="readonly"
            />
          ) : null}
        </div>
      ) : (
        <p className="text-sm text-mute">
          El espacio funciona con normalidad para registrar movimientos y
          cambios acordados.
        </p>
      )}
    </SpaceSection>
  );
}
