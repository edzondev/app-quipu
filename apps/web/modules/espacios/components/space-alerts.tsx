"use client";

import type { Id } from "@/convex/_generated/dataModel";
import { SpaceProposalBanner } from "./space-proposal-banner";
import { SpaceReadonlyBanner } from "./space-readonly-banner";

type Member = {
	profileId: Id<"profiles">;
	name: string;
};

type Props = {
	spaceId: Id<"financialSpaces">;
	viewerProfileId: Id<"profiles">;
	viewerRole: "owner" | "member";
	status: "active" | "readonly" | "closed";
	ownerIsPremium: boolean;
	members: Member[];
	currencyCode: string;
	readonly: boolean;
};

export function SpaceAlerts({
	spaceId,
	viewerProfileId,
	viewerRole,
	status,
	ownerIsPremium,
	members,
	currencyCode,
	readonly,
}: Props) {
	return (
		<div className="space-y-2.5">
			{readonly ? (
				<SpaceReadonlyBanner
					spaceId={spaceId}
					viewerRole={viewerRole}
					status={status}
					ownerIsPremium={ownerIsPremium}
				/>
			) : null}
			<SpaceProposalBanner
				spaceId={spaceId}
				viewerProfileId={viewerProfileId}
				members={members}
				currencyCode={currencyCode}
			/>
		</div>
	);
}
