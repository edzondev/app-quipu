"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel";
import { AnalyticsEvents, track } from "@/core/analytics";
import { fromConvexError } from "@/core/errors";
import { buttonVariants } from "@/shared/components/ui/button-variants";
import { cn } from "@/shared/lib/utils";
import { useRespondProposal } from "../actions";
import { ESPACIOS_PROPOSAL_TITLE } from "../constants";
import {
  formatSpaceProposalLabel,
  type SpaceProposalKind,
} from "../lib/space-proposal-labels";

export type SpacePendingProposal = {
  _id: Id<"spaceChangeProposals">;
  kind: SpaceProposalKind;
  payload: unknown;
  proposedByProfileId: Id<"profiles">;
};

type ProposalMember = {
  profileId: Id<"profiles">;
  name: string;
};

type Props = {
  spaceId: Id<"financialSpaces">;
  proposals: SpacePendingProposal[];
  viewerProfileId: Id<"profiles">;
  members: ProposalMember[];
  currencyCode: string;
  kind?: SpaceProposalKind;
  className?: string;
  showTitle?: boolean;
};

export function SpaceProposalResponseList({
  spaceId,
  proposals,
  viewerProfileId,
  members,
  currencyCode,
  kind,
  className,
  showTitle = true,
}: Props) {
  const respond = useRespondProposal();
  const [pendingId, setPendingId] = useState<Id<"spaceChangeProposals"> | null>(
    null,
  );

  const actionable = proposals.filter(
    (proposal) =>
      proposal.proposedByProfileId !== viewerProfileId &&
      (kind === undefined || proposal.kind === kind),
  );

  if (actionable.length === 0) return null;

  function memberNameForProposal(
    proposalKind: SpaceProposalKind,
    payload: unknown,
  ) {
    if (proposalKind !== "expected_contribution") return undefined;
    const profileId = (payload as { profileId?: Id<"profiles"> }).profileId;
    return members.find((member) => member.profileId === profileId)?.name;
  }

  async function handleDecision(
    proposalId: Id<"spaceChangeProposals">,
    decision: "approve" | "reject",
    proposalKind: SpaceProposalKind,
  ) {
    setPendingId(proposalId);
    try {
      await respond({ proposalId, decision });
      track(
        decision === "approve"
          ? AnalyticsEvents.SPACE_PROPOSAL_CONFIRMED
          : AnalyticsEvents.SPACE_PROPOSAL_REJECTED,
        {
          space_id: spaceId,
          proposal_kind: proposalKind,
        },
      );
      toast.success(
        decision === "approve" ? "Cambio aprobado" : "Cambio rechazado",
      );
    } catch (error) {
      toast.error(fromConvexError(error).message);
    }
    setPendingId(null);
  }

  return (
    <section
      className={cn(
        "rounded-lg border border-line/60 bg-surface-warm/30 px-3.5 py-3",
        className,
      )}
    >
      {showTitle ? (
        <p className="text-[12px] font-medium text-qp-deep">
          {ESPACIOS_PROPOSAL_TITLE}
        </p>
      ) : null}
      <ul className={cn("space-y-3", showTitle && "mt-2.5")}>
        {actionable.map((proposal) => (
          <li key={proposal._id}>
            <p className="text-[13.5px] leading-relaxed text-ink">
              {formatSpaceProposalLabel(proposal.kind, proposal.payload, {
                memberName: memberNameForProposal(
                  proposal.kind,
                  proposal.payload,
                ),
                currencyCode,
              })}
            </p>
            <div className="mt-2.5 flex gap-2">
              <button
                type="button"
                className={cn(
                  buttonVariants({ variant: "default" }),
                  "h-8 px-3 text-xs",
                )}
                disabled={pendingId === proposal._id}
                onClick={() =>
                  handleDecision(proposal._id, "approve", proposal.kind)
                }
              >
                {pendingId === proposal._id ? "…" : "Aprobar"}
              </button>
              <button
                type="button"
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "h-8 px-3 text-xs",
                )}
                disabled={pendingId === proposal._id}
                onClick={() =>
                  handleDecision(proposal._id, "reject", proposal.kind)
                }
              >
                Rechazar
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
