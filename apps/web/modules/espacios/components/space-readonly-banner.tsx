"use client";

import Link from "next/link";
import { useTransition } from "react";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel";
import { AnalyticsEvents, track } from "@/core/analytics";
import { fromConvexError } from "@/core/errors";
import { PremiumLockCard } from "@/shared/components/premium-lock-card";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";
import { useReactivateSpace } from "../actions";
import {
  ESPACIOS_READONLY_BANNER,
  ESPACIOS_READONLY_REACTIVATE_HINT,
  ESPACIOS_SETTINGS_REACTIVATE,
  ESPACIOS_SETTINGS_REACTIVATED,
} from "../constants";
import { canEditSpaceSettingsSection } from "../lib/space-settings-permissions";

type Props = {
  spaceId: Id<"financialSpaces">;
  viewerRole: "owner" | "member";
  status: "active" | "readonly" | "closed";
  ownerIsPremium: boolean;
  className?: string;
};

export function SpaceReadonlyBanner({
  spaceId,
  viewerRole,
  status,
  ownerIsPremium,
  className,
}: Props) {
  const reactivate = useReactivateSpace();
  const [pending, startReactivate] = useTransition();

  const canReactivate =
    status === "readonly" &&
    canEditSpaceSettingsSection(viewerRole, status, "reactivate", {
      canReactivate: viewerRole === "owner" && ownerIsPremium,
    });

  function handleReactivate() {
    startReactivate(async () => {
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
    <div
      className={cn(
        "rounded-[14px] border border-line bg-card px-4 py-3 text-sm text-mute",
        className,
      )}
    >
      <p>{ESPACIOS_READONLY_BANNER}</p>
      {status === "readonly" && viewerRole === "owner" ? (
        <div className="mt-3">
          {canReactivate ? (
            <Button size="sm" disabled={pending} onClick={handleReactivate}>
              {pending ? "Reactivando…" : ESPACIOS_SETTINGS_REACTIVATE}
            </Button>
          ) : !ownerIsPremium ? (
            <PremiumLockCard
              className="mt-2"
              title="Reactiva tu espacio compartido"
              body={ESPACIOS_READONLY_REACTIVATE_HINT}
              espaciosPaywallSurface="readonly"
            />
          ) : null}
        </div>
      ) : null}
      {status === "readonly" && viewerRole === "member" ? (
        <p className="mt-2 text-[12px]">
          Pide al titular que renueve Quipu Plus.{" "}
          <Link
            href={`/espacios/${spaceId}/configuracion`}
            className="text-qp-deep underline-offset-2 hover:underline"
          >
            Ver configuración
          </Link>
        </p>
      ) : null}
    </div>
  );
}
