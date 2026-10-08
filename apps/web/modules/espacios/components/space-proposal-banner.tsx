"use client";

import { useMemo } from "react";
import type { Id } from "@/convex/_generated/dataModel";
import type { SpaceProposalKind } from "../lib/space-proposal-labels";
import { usePendingProposals } from "../queries";
import { SpaceProposalResponseList } from "./space-proposal-response-list";

type ProposalMember = {
	profileId: Id<"profiles">;
	name: string;
};

type Props = {
	spaceId: Id<"financialSpaces">;
	viewerProfileId: Id<"profiles">;
	members: ProposalMember[];
	currencyCode: string;
	excludeKinds?: SpaceProposalKind[];
};

const DEFAULT_EXCLUDE_KINDS: SpaceProposalKind[] = ["expected_contribution"];

export function SpaceProposalBanner({
	spaceId,
	viewerProfileId,
	members,
	currencyCode,
	excludeKinds = DEFAULT_EXCLUDE_KINDS,
}: Props) {
	const proposals = usePendingProposals(spaceId);
	const excludeSet = useMemo(() => new Set(excludeKinds), [excludeKinds]);

	if (proposals === undefined || proposals.length === 0) return null;

	const visible = proposals.filter((proposal) => !excludeSet.has(proposal.kind));
	if (visible.length === 0) return null;

	return (
		<SpaceProposalResponseList
			spaceId={spaceId}
			proposals={visible}
			viewerProfileId={viewerProfileId}
			members={members}
			currencyCode={currencyCode}
		/>
	);
}
