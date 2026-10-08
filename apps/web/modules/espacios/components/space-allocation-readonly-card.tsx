"use client";

import { AllocationBar } from "@/modules/onboarding/components/allocation-bar";
import { ESPACIOS_SETTINGS_BUDGET } from "../constants";
import { formatSpaceAllocationSummary } from "../lib/space-status-labels";
import type { SpaceSettings } from "../queries";
import { SpaceSection } from "./space-section";

type Props = {
	settings: SpaceSettings;
};

export function SpaceAllocationReadonlyCard({ settings }: Props) {
	const { allocationNeeds, allocationWants, allocationSavings } = settings.space;

	return (
		<SpaceSection title={ESPACIOS_SETTINGS_BUDGET}>
			<AllocationBar needs={allocationNeeds} wants={allocationWants} savings={allocationSavings} />
			<p className="mt-3 text-[13px] text-mute">
				{formatSpaceAllocationSummary(allocationNeeds, allocationWants, allocationSavings)}
			</p>
		</SpaceSection>
	);
}
