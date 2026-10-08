"use client";

import type { Id } from "@/convex/_generated/dataModel";
import { formatCents } from "@/shared/lib/money";
import {
	ESPACIOS_PARTICIPATION_CONTRIBUTED_LABEL,
	ESPACIOS_PARTICIPATION_EXPLICIT,
	ESPACIOS_PARTICIPATION_GOAL_LABEL,
	ESPACIOS_PARTICIPATION_GOAL_UNDEFINED,
	ESPACIOS_PARTICIPATION_PERSONAL_POCKET,
	ESPACIOS_PARTICIPATION_SUBTITLE,
	ESPACIOS_SETTINGS_PARTICIPATION,
} from "../constants";
import { formatSpaceRole } from "../lib/space-status-labels";
import { participationPercent } from "../lib/spaceParticipation";
import type { SpaceOverview } from "../queries";
import { SpaceProposalResponseList } from "./space-proposal-response-list";
import { SpaceSection } from "./space-section";

type Props = {
	spaceId: Id<"financialSpaces">;
	members: SpaceOverview["members"];
	currencyCode: string;
	pendingProposals?: SpaceOverview["pendingProposals"];
	viewerProfileId?: Id<"profiles">;
};

const EMPTY_PROPOSALS: SpaceOverview["pendingProposals"] = [];

export function SpaceMembersParticipation({
	spaceId,
	members,
	currencyCode,
	pendingProposals = EMPTY_PROPOSALS,
	viewerProfileId,
}: Props) {
	return (
		<SpaceSection
			title={ESPACIOS_SETTINGS_PARTICIPATION}
			description={ESPACIOS_PARTICIPATION_SUBTITLE}
			contentClassName="py-4"
		>
			{viewerProfileId ? (
				<SpaceProposalResponseList
					spaceId={spaceId}
					proposals={pendingProposals}
					viewerProfileId={viewerProfileId}
					members={members}
					currencyCode={currencyCode}
					kind="expected_contribution"
					showTitle={false}
					className="mb-4 border-l-2 border-qp bg-qp-soft/30 py-2 pl-3 shadow-none"
				/>
			) : null}

			<ul className="space-y-5">
				{members.map((member) => {
					const hasGoal = member.expectedContributionCents > 0;
					const pct = hasGoal
						? participationPercent(member.contributedCents, member.expectedContributionCents)
						: 0;
					const hasBreakdown =
						member.personalPocketCents > 0 && member.explicitContributionCents > 0;

					return (
						<li
							key={member.profileId}
							className="border-t border-line/50 pt-4 first:border-t-0 first:pt-0"
						>
							<div className="flex items-start justify-between gap-3">
								<div>
									<p className="text-sm font-medium text-ink">{member.name}</p>
									<p className="mt-0.5 text-[12px] text-mute">{formatSpaceRole(member.role)}</p>
								</div>
								<div className="text-right">
									<p className="text-[11px] text-mute">
										{ESPACIOS_PARTICIPATION_CONTRIBUTED_LABEL}
									</p>
									<p className="font-serif text-[15px] tabular-nums text-qp-deep">
										{formatCents(member.contributedCents, {
											currency: currencyCode,
										})}
									</p>
								</div>
							</div>

							{hasBreakdown ? (
								<p className="mt-2 text-[12px] leading-relaxed text-mute">
									{formatCents(member.explicitContributionCents, {
										currency: currencyCode,
									})}{" "}
									{ESPACIOS_PARTICIPATION_EXPLICIT}
									{" · "}
									{formatCents(member.personalPocketCents, {
										currency: currencyCode,
									})}{" "}
									{ESPACIOS_PARTICIPATION_PERSONAL_POCKET}
								</p>
							) : member.personalPocketCents > 0 ? (
								<p className="mt-2 text-[12px] text-mute">
									{formatCents(member.personalPocketCents, {
										currency: currencyCode,
									})}{" "}
									{ESPACIOS_PARTICIPATION_PERSONAL_POCKET}
								</p>
							) : null}

							<div className="mt-2.5 flex items-baseline justify-between gap-3 text-[12px]">
								<span className="text-mute">{ESPACIOS_PARTICIPATION_GOAL_LABEL}</span>
								<span className="font-medium tabular-nums text-ink-secondary">
									{hasGoal
										? formatCents(member.expectedContributionCents, {
												currency: currencyCode,
											})
										: ESPACIOS_PARTICIPATION_GOAL_UNDEFINED}
								</span>
							</div>

							{hasGoal ? (
								<div
									className="mt-2 h-1 overflow-hidden rounded-full bg-line/50"
									role="progressbar"
									aria-valuenow={pct}
									aria-valuemin={0}
									aria-valuemax={100}
									aria-label={`${pct}% de la meta`}
								>
									<div
										className="h-full rounded-full bg-qp transition-[width]"
										style={{ width: `${pct}%` }}
									/>
								</div>
							) : null}
						</li>
					);
				})}
			</ul>
		</SpaceSection>
	);
}
