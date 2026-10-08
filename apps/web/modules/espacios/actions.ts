"use client";

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

export function useCreateSpace() {
	return useMutation(api.spaces.create);
}

export function useAcceptInvitation() {
	return useMutation(api.spaceInvitations.accept);
}

export function useCreateInvitation() {
	return useMutation(api.spaceInvitations.create);
}

export function useRevokeInvitation() {
	return useMutation(api.spaceInvitations.revoke);
}

export function useContributeToSpace() {
	return useMutation(api.spaceContributions.contribute);
}

export function useRegisterSpaceExpense() {
	return useMutation(api.spaceExpenses.register);
}

export function useRespondProposal() {
	return useMutation(api.spaceChangeProposals.respond);
}

export function useReactivateSpace() {
	return useMutation(api.spaces.reactivate);
}

export function useUpdateSpaceName() {
	return useMutation(api.spaces.updateName);
}

export function useUpdateSpaceAllocation() {
	return useMutation(api.spaces.updateAllocation);
}

export function useUpdateExpectedContribution() {
	return useMutation(api.spaceChangeProposals.updateExpectedContribution);
}

export function useCreateSpaceProposal() {
	return useMutation(api.spaceChangeProposals.create);
}

export function useCloseSpace() {
	return useMutation(api.spaces.close);
}

export function useLeaveSpace() {
	return useMutation(api.spaces.leave);
}

export type SpaceId = Id<"financialSpaces">;
