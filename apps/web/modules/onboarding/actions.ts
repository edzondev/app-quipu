"use server";

import { fetchAuthMutation } from "@/auth/auth-server";
import { api } from "@/convex/_generated/api";
import { fromConvexError } from "@/core/errors";
import { buildOnboardingPayload } from "./lib/payload";

export async function completeOnboardingAction(input: unknown) {
	const parsed = buildOnboardingPayload(input);
	try {
		return await fetchAuthMutation(api.profiles.createProfile, parsed);
	} catch (error) {
		throw fromConvexError(error);
	}
}
