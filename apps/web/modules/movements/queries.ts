"use client";

import { useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

export type MovementsContext = "personal" | { type: "space"; spaceId: Id<"financialSpaces"> };

export type MovementsListData = NonNullable<
	FunctionReturnType<typeof api.movements.listForContext>
>;

export function useMovementsForContext(context: MovementsContext) {
	return useQuery(
		api.movements.listForContext,
		context === "personal"
			? { context: "personal" }
			: { context: { type: "space", spaceId: context.spaceId } },
	);
}

export function useMySpacesForMovements() {
	return useQuery(api.spaces.getMySpaces, {});
}
