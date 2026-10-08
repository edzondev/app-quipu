"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel";
import { AnalyticsEvents, track } from "@/core/analytics";
import { fromConvexError } from "@/core/errors";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { formatCents, parseToCents } from "@/shared/lib/money";
import { useUpdateExpectedContribution } from "../actions";
import {
	ESPACIOS_PARTICIPATION_GOAL_LABEL,
	ESPACIOS_PARTICIPATION_SUBTITLE,
	ESPACIOS_SETTINGS_GOAL_NOTE,
	ESPACIOS_SETTINGS_GOAL_SAVE,
	ESPACIOS_SETTINGS_GOAL_SAVED,
	ESPACIOS_SETTINGS_PARTICIPATION,
	ESPACIOS_SETTINGS_WAITING_PARTNER,
} from "../constants";
import { canEditSpaceSettingsSection } from "../lib/space-settings-permissions";
import { formatSpaceRole } from "../lib/space-status-labels";
import type { SpaceSettings } from "../queries";
import { type SpaceEffectiveOn, SpaceEffectiveOnSelector } from "./space-effective-on-selector";
import { SpaceProposalResponseList } from "./space-proposal-response-list";
import { SpaceSection } from "./space-section";

type Props = {
	spaceId: Id<"financialSpaces">;
	settings: SpaceSettings;
	showCurrentCycleOption: boolean;
	waitingForPartner?: boolean;
};

type MemberGoalEditorProps = {
	spaceId: Id<"financialSpaces">;
	member: SpaceSettings["members"][number];
	currencyCode: string;
	canEdit: boolean;
	showCurrentCycleOption: boolean;
	effectiveOn: SpaceEffectiveOn;
	disabled?: boolean;
};

function MemberGoalEditor({
	spaceId,
	member,
	currencyCode,
	canEdit,
	showCurrentCycleOption,
	effectiveOn,
	disabled,
}: MemberGoalEditorProps) {
	const updateGoal = useUpdateExpectedContribution();
	const [focused, setFocused] = useState(false);
	const [draft, setDraft] = useState("");
	const [isPending, startTransition] = useTransition();

	const formatted =
		member.expectedContributionCents > 0
			? formatCents(member.expectedContributionCents, {
					currency: currencyCode,
				})
			: "";
	const display = focused ? draft : formatted;
	const goalInputId = `space-goal-${member.profileId}`;

	function save(cents: number) {
		if (!canEdit || disabled) return;
		startTransition(async () => {
			try {
				const proposalId = await updateGoal({
					spaceId,
					profileId: member.profileId,
					expectedContributionCents: cents,
					effectiveOn: showCurrentCycleOption ? effectiveOn : "next_cycle",
				});
				if (proposalId) {
					track(AnalyticsEvents.SPACE_PROPOSAL_CREATED, {
						space_id: spaceId,
						proposal_kind: "expected_contribution",
					});
					toast.success(ESPACIOS_SETTINGS_WAITING_PARTNER);
				} else {
					toast.success(ESPACIOS_SETTINGS_GOAL_SAVED);
				}
			} catch (error) {
				toast.error(fromConvexError(error).message);
			}
		});
	}

	function commit() {
		const trimmed = draft.trim();
		if (!trimmed) {
			save(0);
			setDraft("");
			return;
		}
		const parsed = parseToCents(trimmed);
		if (parsed === null) {
			setDraft(formatted);
			return;
		}
		if (parsed === member.expectedContributionCents) return;
		save(parsed);
		setDraft(formatCents(parsed, { currency: currencyCode }));
	}

	return (
		<li className="rounded-lg bg-surface-warm/40 px-3.5 py-3">
			<div className="flex items-center justify-between gap-3">
				<span className="text-sm font-medium text-ink">{member.name}</span>
				<span className="text-[12px] text-mute">{formatSpaceRole(member.role)}</span>
			</div>

			<label htmlFor={goalInputId} className="mt-3 block text-[12.5px] text-mute">
				{ESPACIOS_PARTICIPATION_GOAL_LABEL}
			</label>
			<Input
				id={goalInputId}
				className="mt-1.5"
				inputMode="decimal"
				disabled={!canEdit || disabled || isPending}
				value={display}
				placeholder={formatCents(0, { currency: currencyCode })}
				onFocus={() => {
					setDraft(formatted);
					setFocused(true);
				}}
				onChange={(event) => setDraft(event.target.value)}
				onBlur={() => {
					setFocused(false);
					commit();
				}}
				onKeyDown={(event) => {
					if (event.key === "Enter") {
						event.preventDefault();
						event.currentTarget.blur();
					}
				}}
			/>

			{canEdit ? (
				<Button
					type="button"
					variant="outline"
					size="sm"
					className="mt-3 border-line text-body-secondary"
					disabled={disabled || isPending}
					onClick={() => {
						const trimmed = draft.trim();
						const cents = trimmed ? parseToCents(trimmed) : 0;
						if (trimmed && cents === null) return;
						save(cents ?? 0);
					}}
				>
					{isPending ? "Guardando…" : ESPACIOS_SETTINGS_GOAL_SAVE}
				</Button>
			) : null}
		</li>
	);
}

export function SpaceSettingsParticipationSection({
	spaceId,
	settings,
	showCurrentCycleOption,
	waitingForPartner,
}: Props) {
	const [effectiveOn, setEffectiveOn] = useState<SpaceEffectiveOn>("next_cycle");
	const canEditAnyGoal = settings.members.some((member) =>
		canEditSpaceSettingsSection(settings.viewerRole, settings.space.status, "contribution", {
			isWritable: settings.isWritable,
			targetIsSelf: member.profileId === settings.viewerProfileId,
		}),
	);

	return (
		<SpaceSection
			title={ESPACIOS_SETTINGS_PARTICIPATION}
			description={`${ESPACIOS_PARTICIPATION_SUBTITLE} ${ESPACIOS_SETTINGS_GOAL_NOTE}`}
		>
			{waitingForPartner ? (
				<p className="mb-3 rounded-lg bg-qp-soft/80 px-3 py-2 text-[13px] text-qp-deep">
					{ESPACIOS_SETTINGS_WAITING_PARTNER}
				</p>
			) : null}

			<SpaceProposalResponseList
				spaceId={spaceId}
				proposals={settings.pendingProposals}
				viewerProfileId={settings.viewerProfileId}
				members={settings.members}
				currencyCode={settings.space.currencyCode}
				kind="expected_contribution"
				showTitle={false}
				className="mb-4 border-l-2 border-qp bg-qp-soft/30 py-2 pl-3 shadow-none"
			/>

			{canEditAnyGoal && showCurrentCycleOption ? (
				<SpaceEffectiveOnSelector
					value={effectiveOn}
					onChange={setEffectiveOn}
					disabled={waitingForPartner}
					showCurrentCycleOption={showCurrentCycleOption}
				/>
			) : null}

			<ul className="mt-4 space-y-3">
				{settings.members.map((member) => {
					const canEdit = canEditSpaceSettingsSection(
						settings.viewerRole,
						settings.space.status,
						"contribution",
						{
							isWritable: settings.isWritable,
							targetIsSelf: member.profileId === settings.viewerProfileId,
						},
					);

					return (
						<MemberGoalEditor
							key={member.profileId}
							spaceId={spaceId}
							member={member}
							currencyCode={settings.space.currencyCode}
							canEdit={canEdit}
							showCurrentCycleOption={showCurrentCycleOption}
							effectiveOn={effectiveOn}
							disabled={waitingForPartner}
						/>
					);
				})}
			</ul>
		</SpaceSection>
	);
}
