"use client";

import { useMutation } from "convex/react";
import type { FunctionArgs } from "convex/server";
import { api } from "@/convex/_generated/api";
import { type SubmitFeedbackInput, submitFeedbackInputSchema } from "./schemas";

export function useSubmitFeedback() {
	return useMutation(api.feedback.submitFeedback);
}

type SubmitFeedbackMutationArgs = FunctionArgs<typeof api.feedback.submitFeedback>;

export function parseSubmitFeedbackInput(raw: SubmitFeedbackInput): SubmitFeedbackMutationArgs {
	const parsed = submitFeedbackInputSchema.parse(raw);
	return {
		category: parsed.category,
		message: parsed.message,
		...(parsed.pagePath ? { pagePath: parsed.pagePath } : {}),
		...(parsed.userAgent ? { userAgent: parsed.userAgent } : {}),
	};
}

export async function submitFeedback(
	mutate: ReturnType<typeof useSubmitFeedback>,
	raw: SubmitFeedbackInput,
) {
	return mutate(parseSubmitFeedbackInput(raw));
}
