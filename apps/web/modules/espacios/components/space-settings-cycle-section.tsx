"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel";
import { AnalyticsEvents, track } from "@/core/analytics";
import { fromConvexError } from "@/core/errors";
import { Button } from "@/shared/components/ui/button";
import { formatLimaDate } from "@/shared/lib/date";
import { cn } from "@/shared/lib/utils";
import { useCreateSpaceProposal } from "../actions";
import {
	ESPACIOS_SETTINGS_CYCLE,
	ESPACIOS_SETTINGS_CYCLE_DURATION,
	ESPACIOS_SETTINGS_CYCLE_END,
	ESPACIOS_SETTINGS_CYCLE_SAVE,
	ESPACIOS_SETTINGS_CYCLE_SAVED,
	ESPACIOS_SETTINGS_CYCLE_START,
	ESPACIOS_SETTINGS_WAITING_PARTNER,
} from "../constants";
import { canEditSpaceSettingsSection } from "../lib/space-settings-permissions";
import type { SpaceSettings } from "../queries";
import { type SpaceEffectiveOn, SpaceEffectiveOnSelector } from "./space-effective-on-selector";
import { SpaceSection } from "./space-section";

type Props = {
	spaceId: Id<"financialSpaces">;
	settings: SpaceSettings;
	showCurrentCycleOption: boolean;
	waitingForPartner?: boolean;
};

function normalizeDuration(days: number): 15 | 30 {
	return days === 15 ? 15 : 30;
}

export function SpaceSettingsCycleSection({
	spaceId,
	settings,
	showCurrentCycleOption,
	waitingForPartner,
}: Props) {
	const createProposal = useCreateSpaceProposal();
	const [cycleDurationDays, setCycleDurationDays] = useState<15 | 30>(() =>
		normalizeDuration(settings.space.cycleDurationDays),
	);
	const [effectiveOn, setEffectiveOn] = useState<SpaceEffectiveOn>("next_cycle");
	const [isPending, startTransition] = useTransition();

	const canEdit = canEditSpaceSettingsSection(settings.viewerRole, settings.space.status, "cycle", {
		isWritable: settings.isWritable,
	});
	const unchanged = cycleDurationDays === normalizeDuration(settings.space.cycleDurationDays);

	function save() {
		if (!canEdit || unchanged) return;
		startTransition(async () => {
			try {
				const proposalId = await createProposal({
					spaceId,
					kind: "cycle_duration",
					payload: { cycleDurationDays },
					effectiveOn: showCurrentCycleOption ? effectiveOn : "next_cycle",
				});
				if (proposalId) {
					track(AnalyticsEvents.SPACE_PROPOSAL_CREATED, {
						space_id: spaceId,
						proposal_kind: "cycle_duration",
					});
					toast.success(ESPACIOS_SETTINGS_WAITING_PARTNER);
				} else {
					toast.success(ESPACIOS_SETTINGS_CYCLE_SAVED);
				}
			} catch (error) {
				toast.error(fromConvexError(error).message);
			}
		});
	}

	return (
		<SpaceSection title={ESPACIOS_SETTINGS_CYCLE}>
			{settings.cycle ? (
				<div className="flex flex-col gap-2 sm:flex-row">
					<div className="flex-1 rounded-lg bg-surface-warm/50 px-3.5 py-3">
						<p className="text-[12px] text-mute">{ESPACIOS_SETTINGS_CYCLE_START}</p>
						<p className="mt-0.5 text-sm font-medium text-ink">
							{formatLimaDate(settings.cycle.startDate, "es-PE")}
						</p>
					</div>
					<div className="flex-1 rounded-lg bg-surface-warm/50 px-3.5 py-3">
						<p className="text-[12px] text-mute">{ESPACIOS_SETTINGS_CYCLE_END}</p>
						<p className="mt-0.5 text-sm font-medium text-ink">
							{formatLimaDate(settings.cycle.endDate, "es-PE")}
						</p>
					</div>
				</div>
			) : (
				<p className="text-sm text-mute">Sin ciclo activo.</p>
			)}

			{waitingForPartner ? (
				<p className="mt-3 rounded-lg bg-qp-soft/80 px-3 py-2 text-[13px] text-qp-deep">
					{ESPACIOS_SETTINGS_WAITING_PARTNER}
				</p>
			) : null}

			<p className="mt-4 text-[13px] font-medium text-ink-secondary">
				{ESPACIOS_SETTINGS_CYCLE_DURATION}
			</p>
			<div className="mt-2 flex gap-2">
				{([15, 30] as const).map((days) => {
					const selected = cycleDurationDays === days;
					return (
						<button
							key={days}
							type="button"
							disabled={!canEdit || isPending}
							aria-pressed={selected}
							onClick={() => setCycleDurationDays(days)}
							className={cn(
								"flex-1 rounded-lg border px-3 py-3 text-left transition-colors",
								selected
									? "border-qp bg-qp-soft"
									: "border-line/70 bg-card hover:bg-surface-warm/50",
								(!canEdit || isPending) && "cursor-not-allowed opacity-60",
							)}
						>
							<p className="text-sm font-medium text-ink">{days} días</p>
							<p className="mt-0.5 text-[12px] text-mute">Por ciclo</p>
						</button>
					);
				})}
			</div>

			{canEdit ? (
				<>
					<SpaceEffectiveOnSelector
						value={effectiveOn}
						onChange={setEffectiveOn}
						disabled={isPending}
						showCurrentCycleOption={showCurrentCycleOption}
					/>
					<Button
						type="button"
						variant="outline"
						size="sm"
						className="mt-4 border-line text-body-secondary"
						disabled={isPending || unchanged}
						onClick={save}
					>
						{isPending ? "Guardando…" : ESPACIOS_SETTINGS_CYCLE_SAVE}
					</Button>
				</>
			) : null}
		</SpaceSection>
	);
}
