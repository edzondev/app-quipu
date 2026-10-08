"use client";

import { useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { api } from "@/convex/_generated/api";

export type DashboardSummaryQueryResult = FunctionReturnType<typeof api.dashboard.getSummary>;

export type CycleCloseReportQueryResult = FunctionReturnType<
	typeof api.cycleReport.getLatestCloseReport
>;

export type CycleForecastQueryResult = FunctionReturnType<typeof api.forecast.getCycleForecast>;

export function useDashboardSummary() {
	return useQuery(api.dashboard.getSummary, {});
}

export function useLatestCloseReport() {
	return useQuery(api.cycleReport.getLatestCloseReport, {});
}
