"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { AnalyticsEvents, track } from "@/core/analytics";
import { fromConvexError } from "@/core/errors";
import { useAcceptInvitation } from "../actions";
import { useInvitationPreview } from "../queries";
import { EspaciosLoadingSkeleton } from "./espacios-loading-skeleton";

type Props = {
  token: string;
};

export function SpaceInviteAcceptView({ token }: Props) {
  const preview = useInvitationPreview(token);
  const accept = useAcceptInvitation();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestRef = useRef(0);

  if (accepted || preview === undefined) {
    return <EspaciosLoadingSkeleton />;
  }

  if (preview === null) {
    return (
      <section className="rounded-[14px] border border-line bg-card p-5">
        <h1 className="font-serif text-xl text-ink">Invitación no válida</h1>
        <p className="mt-2 text-sm text-mute">
          El enlace expiró, ya fue usado o el espacio ya está completo.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-[14px] border border-line bg-card p-5">
      <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-faint">
        Invitación
      </p>
      <h1 className="mt-2 font-serif text-[28px] text-ink">
        {preview.spaceName}
      </h1>
      <p className="mt-2 text-sm text-mute">
        {preview.inviterName} te invita a un presupuesto compartido en{" "}
        {preview.currencySymbol} ({preview.currencyCode}).
      </p>
      <p className="mt-2 text-sm text-mute">
        No necesitas configurar tus finanzas personales para unirte.
      </p>
      {error ? <p className="mt-3 text-sm text-danger-text">{error}</p> : null}
      <button
        type="button"
        className="mt-5 rounded-[11px] bg-ink px-4 py-2.5 text-sm font-semibold text-canvas"
        disabled={pending}
        onClick={async () => {
          const requestId = ++requestRef.current;
          setPending(true);
          setError(null);
          try {
            const spaceId = await accept({ token });
            if (requestRef.current !== requestId) return;
            track(AnalyticsEvents.SPACE_INVITE_ACCEPTED, { space_id: spaceId });
            setAccepted(true);
            router.push(`/espacios/${spaceId}`);
          } catch (caught) {
            if (requestRef.current !== requestId) return;
            setError(fromConvexError(caught).message);
          }
          if (requestRef.current === requestId) setPending(false);
        }}
      >
        {pending ? "Uniéndote…" : "Unirme al espacio"}
      </button>
    </section>
  );
}
