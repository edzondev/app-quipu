"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel";
import { AnalyticsEvents, track } from "@/core/analytics";
import { fromConvexError } from "@/core/errors";
import { AllocationBar } from "@/modules/onboarding/components/allocation-bar";
import { AllocationRow } from "@/modules/onboarding/components/allocation-row";
import { CheckMark } from "@/modules/onboarding/components/check-mark";
import type { Allocation } from "@/modules/onboarding/lib/allocation";
import { Button } from "@/shared/components/ui/button";
import { ENVELOPES } from "@/shared/constants/envelopes";
import { useUpdateSpaceAllocation } from "../actions";
import {
	ESPACIOS_SETTINGS_ALLOCATION_NOTE,
	ESPACIOS_SETTINGS_ALLOCATION_PROPOSAL,
	ESPACIOS_SETTINGS_ALLOCATION_SAVE,
	ESPACIOS_SETTINGS_ALLOCATION_SAVED,
	ESPACIOS_SETTINGS_BUDGET,
	ESPACIOS_SETTINGS_WAITING_PARTNER,
} from "../constants";
import { type SpaceEffectiveOn, SpaceEffectiveOnSelector } from "./space-effective-on-selector";
import { SpaceSection } from "./space-section";

type Props = {
	spaceId: Id<"financialSpaces">;
	initialAllocation: Allocation;
	disabled?: boolean;
	showCurrentCycleOption: boolean;
	waitingForPartner?: boolean;
};

export function SpaceAllocationEditor({
	spaceId,
	initialAllocation,
	disabled,
	showCurrentCycleOption,
	waitingForPartner,
}: Props) {
	const updateAllocation = useUpdateSpaceAllocation();
	const [state, setState] = useState<Allocation>(initialAllocation);
	const [effectiveOn, setEffectiveOn] = useState<SpaceEffectiveOn>("next_cycle");
	const [isPending, startTransition] = useTransition();

	const total = state.allocationNeeds + state.allocationWants + state.allocationSavings;
	const unchanged =
		state.allocationNeeds === initialAllocation.allocationNeeds &&
		state.allocationWants === initialAllocation.allocationWants &&
		state.allocationSavings === initialAllocation.allocationSavings;

	function save() {
		if (total !== 100 || disabled) return;
		startTransition(async () => {
			try {
				const result = await updateAllocation({
					spaceId,
					allocationNeeds: state.allocationNeeds,
					allocationWants: state.allocationWants,
					allocationSavings: state.allocationSavings,
					effectiveOn: showCurrentCycleOption ? effectiveOn : "next_cycle",
				});
				if (result.applied) {
					toast.success(ESPACIOS_SETTINGS_ALLOCATION_SAVED);
				} else {
					track(AnalyticsEvents.SPACE_PROPOSAL_CREATED, {
						space_id: spaceId,
						proposal_kind: "allocation",
					});
					toast.success(ESPACIOS_SETTINGS_ALLOCATION_PROPOSAL);
				}
			} catch (error) {
				toast.error(fromConvexError(error).message);
			}
		});
	}

	return (
		<SpaceSection title={ESPACIOS_SETTINGS_BUDGET} description={ESPACIOS_SETTINGS_ALLOCATION_NOTE}>
			{waitingForPartner ? (
				<p className="mb-4 rounded-lg bg-qp-soft/80 px-3 py-2 text-[13px] text-qp-deep">
					{ESPACIOS_SETTINGS_WAITING_PARTNER}
				</p>
			) : null}

			<AllocationBar
				needs={state.allocationNeeds}
				wants={state.allocationWants}
				savings={state.allocationSavings}
			/>

			<div className="mt-4 flex flex-col gap-3.5">
				{ENVELOPES.map((env) => (
					<AllocationRow
						key={env.key}
						envKey={env.key}
						label={env.label}
						desc={env.desc}
						barColor={env.barColor}
						value={state[env.key]}
						state={state}
						dispatch={(payload) => setState((prev) => ({ ...prev, ...payload }))}
					/>
				))}

				{total === 100 ? (
					<div className="flex items-center gap-2 text-[13px] text-qp-deep">
						<span className="flex size-4 items-center justify-center rounded-full bg-qp-soft">
							<CheckMark size={10} strokeWidth={3.5} />
						</span>
						Reparto válido
					</div>
				) : (
					<div className="rounded-lg bg-danger-bg p-3 text-sm text-danger-ink" role="alert">
						El reparto suma {total}%. Ajusta para que sea exactamente 100%.
					</div>
				)}
			</div>

			<SpaceEffectiveOnSelector
				value={effectiveOn}
				onChange={setEffectiveOn}
				disabled={disabled || isPending}
				showCurrentCycleOption={showCurrentCycleOption}
			/>

			<Button
				className="mt-4 w-full sm:w-auto"
				size="sm"
				disabled={disabled || isPending || total !== 100 || unchanged}
				onClick={save}
			>
				{isPending ? "Guardando…" : ESPACIOS_SETTINGS_ALLOCATION_SAVE}
			</Button>
		</SpaceSection>
	);
}
