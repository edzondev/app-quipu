"use client";

import { useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { api } from "@/convex/_generated/api";

export type CycleSavingsBreakdown = NonNullable<
	FunctionReturnType<typeof api.savings.getCycleSavingsBreakdown>
>;

export function useCycleSavingsBreakdown() {
	return useQuery(api.savings.getCycleSavingsBreakdown, {});
}

export type MoveSurplusContext = NonNullable<
	FunctionReturnType<typeof api.savings.getMoveSurplusContext>
>;
