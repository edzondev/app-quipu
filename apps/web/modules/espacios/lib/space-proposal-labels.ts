import { formatCents } from "@/shared/lib/money";

export type SpaceProposalKind = "allocation" | "cycle_duration" | "expected_contribution";

type AllocationPayload = {
	allocationNeeds: number;
	allocationWants: number;
	allocationSavings: number;
};

type CycleDurationPayload = {
	cycleDurationDays: number;
};

type ExpectedContributionPayload = {
	profileId: string;
	expectedContributionCents: number;
};

export function formatSpaceProposalLabel(
	kind: SpaceProposalKind,
	payload: unknown,
	options?: { memberName?: string; currencyCode?: string },
): string {
	if (kind === "allocation") {
		const data = payload as AllocationPayload;
		return `Cambiar distribución a ${data.allocationNeeds}% necesidades · ${data.allocationWants}% gustos · ${data.allocationSavings}% ahorro`;
	}

	if (kind === "cycle_duration") {
		const data = payload as CycleDurationPayload;
		return `Cambiar duración del ciclo a ${data.cycleDurationDays} días`;
	}

	const data = payload as ExpectedContributionPayload;
	const name = options?.memberName ?? "un miembro";
	const amount = formatCents(data.expectedContributionCents, {
		currency: options?.currencyCode,
	});
	return `Meta de ${name} a ${amount}`;
}
