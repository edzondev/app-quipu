"use client";

import { useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

export type SpaceOverview = NonNullable<FunctionReturnType<typeof api.spaces.getOverview>>;

export type SpaceSettings = NonNullable<FunctionReturnType<typeof api.spaces.getSettings>>;

export function useMySpaces() {
	return useQuery(api.spaces.getMySpaces, {});
}

export function useSpaceOverview(spaceId: Id<"financialSpaces"> | undefined) {
	return useQuery(api.spaces.getOverview, spaceId ? { spaceId } : "skip");
}

export function useSpaceSettings(spaceId: Id<"financialSpaces"> | undefined) {
	return useQuery(api.spaces.getSettings, spaceId ? { spaceId } : "skip");
}

export function usePendingProposals(spaceId: Id<"financialSpaces"> | undefined) {
	return useQuery(api.spaceChangeProposals.listPending, spaceId ? { spaceId } : "skip");
}

export function useInvitationPreview(token: string | undefined) {
	return useQuery(api.spaceInvitations.previewByToken, token ? { token } : "skip");
}
