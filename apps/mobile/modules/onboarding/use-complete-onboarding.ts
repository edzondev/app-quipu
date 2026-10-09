import { api } from "@quipu/convex-api";
import { useMutation } from "convex/react";
import type { FunctionArgs } from "convex/server";
import { useState } from "react";
import { isCommitmentValid } from "@/shared/lib/onboarding/commitments";
import { buildOnboardingPayload } from "@/shared/lib/onboarding/payload";
import type { DraftCommitment } from "@/shared/lib/onboarding/types";
import { useOnboarding } from "./onboarding-provider";

const PROFILE_ERROR = "No se pudo crear tu sistema. Intenta de nuevo.";
const COMMITMENTS_ERROR = "No se pudieron guardar los compromisos.";

type BulkCommitment = FunctionArgs<
	typeof api.fixedCommitments.createCommitmentsBulk
>["commitments"][number];

function toBulkCommitment(commitment: DraftCommitment): BulkCommitment {
	return {
		name: commitment.name.trim(),
		amount: commitment.amountCents,
		envelope: "needs",
		dueDay: commitment.dueDay,
	};
}

export function useCompleteOnboarding() {
	const { state } = useOnboarding();
	const createProfile = useMutation(api.profiles.createProfile);
	const createBulk = useMutation(api.fixedCommitments.createCommitmentsBulk);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [commitmentsFailed, setCommitmentsFailed] = useState(false);

	async function submit() {
		setIsSubmitting(true);
		setError(null);
		setCommitmentsFailed(false);
		try {
			const profileId = await createProfile(buildOnboardingPayload(state));
			const valid = state.commitments.filter(isCommitmentValid);
			if (valid.length > 0) {
				try {
					await createBulk({
						profileId,
						commitments: valid.map(toBulkCommitment),
					});
				} catch {
					setCommitmentsFailed(true);
					setError(COMMITMENTS_ERROR);
					return false;
				}
			}
			return true;
		} catch {
			setError(PROFILE_ERROR);
			return false;
		} finally {
			setIsSubmitting(false);
		}
	}

	return { submit, isSubmitting, error, commitmentsFailed };
}
