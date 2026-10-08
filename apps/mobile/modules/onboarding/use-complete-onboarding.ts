import { api } from "@quipu/convex-api";
import { useMutation } from "convex/react";
import { useCallback, useState } from "react";
import { buildOnboardingPayload } from "@/shared/lib/onboarding/payload";
import { useOnboarding } from "./onboarding-provider";

export function useCompleteOnboarding() {
	const { state, dispatch } = useOnboarding();
	const createProfile = useMutation(api.profiles.createProfile);
	const createBulk = useMutation(api.fixedCommitments.createCommitmentsBulk);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const submit = useCallback(async () => {
		setIsSubmitting(true);
		setError(null);
		try {
			const payload = buildOnboardingPayload(state);
			const profileId = await createProfile(payload);
			if (state.commitments.length > 0) {
				await createBulk({
					profileId,
					commitments: state.commitments.map((c) => ({
						name: c.name,
						amount: c.amountCents,
						envelope: "needs" as const,
						dueDay: c.dueDay,
					})),
				});
			}
			dispatch({ type: "SET_STEP", payload: "success" });
		} catch (e) {
			setError(e instanceof Error ? e.message : "No se pudo crear tu sistema. Intenta de nuevo.");
		} finally {
			setIsSubmitting(false);
		}
	}, [state, createProfile, createBulk, dispatch]);

	return { submit, isSubmitting, error };
}
