import { api } from "@quipu/convex-api";
import { useQuery } from "convex/react";
import { emptyCommitments, presentCommitments } from "@/shared/lib/commitments/model";
import { useProfileGate } from "./use-profile-gate";

export function useCommitments() {
	const { isAuthReady } = useProfileGate();
	const coverage = useQuery(api.fixedCommitments.getCommitmentCoverage, isAuthReady ? {} : "skip");
	if (coverage === undefined) return { status: "loading" as const, model: null };
	if (!coverage) return { status: "ready" as const, model: emptyCommitments() };
	return { status: "ready" as const, model: presentCommitments(coverage) };
}
