"use client";

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

export function useUpdateAllocations() {
	return useMutation(api.settings.updateAllocations);
}

export function useUpdateNotificationPreferences() {
	return useMutation(api.settings.updateNotificationPreferences);
}

export function useUpdateExtraordinaryRules() {
	return useMutation(api.settings.updateExtraordinaryRules);
}

export function useUpdateDisplayName() {
	return useMutation(api.profiles.updateProfileSettings);
}

export function useUpdateCycleSchedule() {
	return useMutation(api.settings.updateCycleSchedule);
}

export function useRevokeAllSessions() {
	return useMutation(api.settings.revokeAllSessions);
}
