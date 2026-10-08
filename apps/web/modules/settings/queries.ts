"use client";

import { useConvex, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { api } from "@/convex/_generated/api";

/** Convex query refs for settings module (single import boundary for UI). */
export const settingsQueries = {
	getSettingsOverview: api.settings.getSettingsOverview,
	getSummary: api.dashboard.getSummary,
	listMyCommitments: api.fixedCommitments.listMyCommitments,
} as const;

export type SettingsOverviewQueryResult = FunctionReturnType<
	typeof settingsQueries.getSettingsOverview
>;

export function useSettingsOverview() {
	return useQuery(settingsQueries.getSettingsOverview, {});
}

export function useSettingsDashboardSummary() {
	return useQuery(settingsQueries.getSummary, {});
}

export function useSettingsCommitments() {
	return useQuery(settingsQueries.listMyCommitments, {});
}

/**
 * D3 — exportación bajo demanda (no suscripción): devuelve una función que
 * dispara la query una sola vez al hacer click en "Descargar mis datos".
 */
export function useExportMyData() {
	const convex = useConvex();
	return () => convex.query(api.profiles.exportMyData, {});
}
