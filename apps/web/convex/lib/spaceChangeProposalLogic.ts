import type { Doc, Id } from "../_generated/dataModel";

export type ProposalKind = Doc<"spaceChangeProposals">["kind"];
export type ProposalEffectiveOn = Doc<"spaceChangeProposals">["effectiveOn"];

export function canProposeChange(input: {
	role: Doc<"spaceMembers">["role"];
	kind: ProposalKind;
	targetProfileId?: Id<"profiles">;
	callerProfileId: Id<"profiles">;
}): boolean {
	if (input.role === "owner") {
		return (
			input.kind === "allocation" ||
			input.kind === "cycle_duration" ||
			input.kind === "expected_contribution"
		);
	}
	return input.kind === "expected_contribution" && input.targetProfileId === input.callerProfileId;
}

export function shouldRequireDualConfirmation(effectiveOn: ProposalEffectiveOn): boolean {
	return effectiveOn === "current_cycle";
}

export function canRespondToProposal(input: {
	proposedByProfileId: Id<"profiles">;
	responderProfileId: Id<"profiles">;
}): boolean {
	return input.proposedByProfileId !== input.responderProfileId;
}
