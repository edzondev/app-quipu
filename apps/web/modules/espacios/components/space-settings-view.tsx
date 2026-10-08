"use client";

import type { Id } from "@/convex/_generated/dataModel";
import { ESPACIOS_SETTINGS_TITLE } from "../constants";
import type { SpaceProposalKind } from "../lib/space-proposal-labels";
import { canEditSpaceSettingsSection } from "../lib/space-settings-permissions";
import { type SpaceSettings, useSpaceSettings } from "../queries";
import { EspaciosLoadingSkeleton } from "./espacios-loading-skeleton";
import { SpaceAlerts } from "./space-alerts";
import { SpaceAllocationEditor } from "./space-allocation-editor";
import { SpaceAllocationReadonlyCard } from "./space-allocation-readonly-card";
import { SpacePageShell } from "./space-page-shell";
import { SpaceSettingsBentoCell, SpaceSettingsBentoGrid } from "./space-settings-bento-grid";
import { SpaceSettingsCycleSection } from "./space-settings-cycle-section";
import { SpaceSettingsDangerSection } from "./space-settings-danger-section";
import { SpaceSettingsGeneralSection } from "./space-settings-general-section";
import { SpaceSettingsMembersSection } from "./space-settings-members-section";
import { SpaceSettingsParticipationSection } from "./space-settings-participation-section";
import { SpaceSettingsStatusSection } from "./space-settings-status-section";

type Props = {
	spaceId: Id<"financialSpaces">;
};

function hasPendingProposalByViewer(settings: SpaceSettings, kind: SpaceProposalKind): boolean {
	return settings.pendingProposals.some(
		(proposal) =>
			proposal.kind === kind && proposal.proposedByProfileId === settings.viewerProfileId,
	);
}

export function SpaceSettingsView({ spaceId }: Props) {
	const settings = useSpaceSettings(spaceId);

	if (settings === undefined) {
		return <EspaciosLoadingSkeleton />;
	}

	if (settings === null) {
		return (
			<SpacePageShell>
				<p className="mt-6 text-sm leading-relaxed text-mute">
					No pudimos cargar este espacio o ya no tienes acceso.
				</p>
			</SpacePageShell>
		);
	}

	const readonly = settings.space.status === "readonly" || settings.space.status === "closed";
	const showCurrentCycleOption = settings.members.length >= 2;
	const canEditAllocation = settings.canEditStructural;
	const showDangerSection =
		canEditSpaceSettingsSection(settings.viewerRole, settings.space.status, "close") ||
		canEditSpaceSettingsSection(settings.viewerRole, settings.space.status, "leave");

	return (
		<SpacePageShell title={ESPACIOS_SETTINGS_TITLE} maxWidth="6xl">
			<div className="mt-5">
				<SpaceAlerts
					spaceId={spaceId}
					viewerProfileId={settings.viewerProfileId}
					viewerRole={settings.viewerRole}
					status={settings.space.status}
					ownerIsPremium={settings.ownerIsPremium}
					members={settings.members}
					currencyCode={settings.space.currencyCode}
					readonly={readonly}
				/>
			</div>

			<SpaceSettingsBentoGrid>
				<SpaceSettingsBentoCell area="general">
					<SpaceSettingsGeneralSection spaceId={spaceId} settings={settings} />
				</SpaceSettingsBentoCell>

				<SpaceSettingsBentoCell area="allocation">
					{canEditAllocation ? (
						<SpaceAllocationEditor
							spaceId={spaceId}
							initialAllocation={{
								allocationNeeds: settings.space.allocationNeeds,
								allocationWants: settings.space.allocationWants,
								allocationSavings: settings.space.allocationSavings,
							}}
							showCurrentCycleOption={showCurrentCycleOption}
							waitingForPartner={hasPendingProposalByViewer(settings, "allocation")}
						/>
					) : (
						<SpaceAllocationReadonlyCard settings={settings} />
					)}
				</SpaceSettingsBentoCell>

				<SpaceSettingsBentoCell area="cycle">
					<SpaceSettingsCycleSection
						spaceId={spaceId}
						settings={settings}
						showCurrentCycleOption={showCurrentCycleOption}
						waitingForPartner={hasPendingProposalByViewer(settings, "cycle_duration")}
					/>
				</SpaceSettingsBentoCell>

				<SpaceSettingsBentoCell area="participation">
					<SpaceSettingsParticipationSection
						spaceId={spaceId}
						settings={settings}
						showCurrentCycleOption={showCurrentCycleOption}
						waitingForPartner={hasPendingProposalByViewer(settings, "expected_contribution")}
					/>
				</SpaceSettingsBentoCell>

				<SpaceSettingsBentoCell area="members">
					<SpaceSettingsMembersSection spaceId={spaceId} settings={settings} />
				</SpaceSettingsBentoCell>

				<SpaceSettingsBentoCell area="status">
					<SpaceSettingsStatusSection spaceId={spaceId} settings={settings} />
				</SpaceSettingsBentoCell>

				{showDangerSection ? (
					<SpaceSettingsBentoCell area="danger">
						<SpaceSettingsDangerSection spaceId={spaceId} settings={settings} />
					</SpaceSettingsBentoCell>
				) : null}
			</SpaceSettingsBentoGrid>
		</SpacePageShell>
	);
}
