"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { LockKeyholeOpen } from "reicon-react/icons/LockKeyholeOpen";
import { toast } from "sonner";
import { authClient } from "@/auth/auth-client";
import { fromConvexError } from "@/core/errors";
import { ConfirmDestructiveDialog } from "@/shared/components/confirm-destructive-dialog";
import { cn } from "@/shared/lib/utils";
import { useRevokeAllSessions } from "../actions";
import {
  SETTINGS_PASSKEY_ADD,
  SETTINGS_PASSKEY_EMPTY,
  SETTINGS_PASSKEY_ERROR,
  SETTINGS_PASSKEY_PENDING,
  SETTINGS_SECURITY_LABEL,
  SETTINGS_SESSIONS_COUNT,
  SETTINGS_SESSIONS_LABEL,
  SETTINGS_SESSIONS_REVOKE_ALL,
  SETTINGS_SESSIONS_REVOKE_ERROR,
  SETTINGS_SESSIONS_REVOKE_SUCCESS,
  SETTINGS_SESSIONS_STUB,
} from "../constants";
import {
  formatPasskeyUsageSummary,
  passkeyDeviceLabel,
} from "../lib/passkeyDisplay";
import type { SettingsOverview } from "../types";

type Props = {
  sessionsApiReady: SettingsOverview["sessionsApiReady"];
  activeSessionCount?: SettingsOverview["activeSessionCount"];
  className?: string;
  id?: string;
};

function PasskeyRowIcon({ deviceType }: { deviceType: string }) {
  const isMobile = deviceType === "singleDevice";
  return (
    <span className="flex size-[34px] shrink-0 items-center justify-center rounded-[9px] bg-surface-warm">
      {isMobile ? (
        <span className="h-4 w-2.5 rounded-sm border-[1.7px] border-mute" />
      ) : (
        <span className="h-[11px] w-4 rounded-sm border-[1.7px] border-mute" />
      )}
    </span>
  );
}

export function SettingsSecurityCard({
  sessionsApiReady,
  activeSessionCount,
  className,
  id,
}: Props) {
  const passkeysQuery = authClient.useListPasskeys();
  const passkeys = passkeysQuery.data ?? [];
  const passkeysLoading = passkeysQuery.isPending;
  const revokeAll = useRevokeAllSessions();
  const router = useRouter();

  const [addPending, setAddPending] = useState(false);
  const [addMessage, setAddMessage] = useState<string | null>(null);
  const [revokeOpen, setRevokeOpen] = useState(false);
  const [revokePending, startRevoke] = useTransition();

  async function handleAddPasskey() {
    setAddPending(true);
    setAddMessage(null);
    const { error } = await authClient.passkey.addPasskey().finally(() => {
      setAddPending(false);
    });
    if (error) {
      setAddMessage(SETTINGS_PASSKEY_ERROR);
      return;
    }
    void passkeysQuery.refetch?.();
  }

  function handleRevokeAllSessions() {
    startRevoke(async () => {
      try {
        await revokeAll({});
        toast.success(SETTINGS_SESSIONS_REVOKE_SUCCESS);
        setRevokeOpen(false);
        await authClient.signOut();
        router.push("/sign-in");
      } catch (error) {
        toast.error(
          fromConvexError(error).message ?? SETTINGS_SESSIONS_REVOKE_ERROR,
        );
      }
    });
  }

  return (
    <section
      id={id}
      className={cn(
        "scroll-mt-6 rounded-xl border border-line/70 bg-card px-5 py-5 md:self-start md:px-6 md:py-[22px]",
        className,
      )}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="min-w-0 text-[12.5px] font-medium text-ink-secondary">
          {SETTINGS_SECURITY_LABEL}
        </span>
        <LockKeyholeOpen
          size={15}
          weight="Filled"
          className="text-qp"
          aria-hidden
        />
      </div>

      <div className="mb-3.5 flex flex-col gap-2">
        {passkeysLoading ? (
          <div className="h-[58px] animate-pulse rounded-lg bg-surface-warm/40" />
        ) : passkeys.length === 0 ? (
          <p className="rounded-lg bg-surface-warm/40 px-3.5 py-3 text-[13px] text-mute">
            {SETTINGS_PASSKEY_EMPTY}
          </p>
        ) : (
          passkeys.map((passkey) => (
            <div
              key={passkey.id}
              className="flex items-center gap-3 rounded-lg bg-surface-warm/40 px-3.5 py-3"
            >
              <PasskeyRowIcon deviceType={passkey.deviceType} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13.5px] font-semibold text-ink">
                  {passkeyDeviceLabel(passkey.name, passkey.deviceType)}
                </div>
                <div className="text-[11.5px] text-faint">
                  {formatPasskeyUsageSummary(new Date(passkey.createdAt))}
                </div>
              </div>
              <span
                className="size-1.5 shrink-0 rounded-full bg-qp"
                aria-hidden
              />
            </div>
          ))
        )}
      </div>

      <button
        type="button"
        onClick={() => void handleAddPasskey()}
        disabled={addPending}
        className="mb-3.5 w-full rounded-[11px] border border-dashed border-qp-border bg-card py-3 text-[13.5px] font-semibold text-qp-deep transition-colors hover:bg-qp-soft disabled:opacity-60"
      >
        {addPending ? SETTINGS_PASSKEY_PENDING : SETTINGS_PASSKEY_ADD}
      </button>
      {addMessage ? (
        <p role="alert" className="mb-3 text-[12.5px] text-danger-ink">
          {addMessage}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t border-line-soft pt-3.5">
        <span className="min-w-0 flex-1 text-[13px] text-ink-secondary">
          {SETTINGS_SESSIONS_LABEL}
          {sessionsApiReady && activeSessionCount != null ? (
            <span className="mt-0.5 block text-[11px] text-faint">
              {SETTINGS_SESSIONS_COUNT(activeSessionCount)}
            </span>
          ) : null}
        </span>
        {sessionsApiReady ? (
          <>
            <button
              type="button"
              onClick={() => setRevokeOpen(true)}
              className="inline-flex min-h-11 shrink-0 items-center rounded-[11px] px-2.5 text-[12.5px] font-medium text-danger-ink hover:bg-danger-bg hover:underline"
            >
              {SETTINGS_SESSIONS_REVOKE_ALL}
            </button>
            <ConfirmDestructiveDialog
              open={revokeOpen}
              onOpenChange={setRevokeOpen}
              title="¿Cerrar todas las sesiones?"
              description="Se cerrará la sesión en todos los dispositivos, incluido este navegador."
              confirmLabel={SETTINGS_SESSIONS_REVOKE_ALL}
              pending={revokePending}
              onConfirm={() => void handleRevokeAllSessions()}
            />
          </>
        ) : (
          <span className="max-w-[11rem] shrink-0 text-right text-[11.5px] leading-snug text-faint">
            {SETTINGS_SESSIONS_STUB}
          </span>
        )}
      </div>
    </section>
  );
}
