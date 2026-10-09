import { api } from "@quipu/convex-api";
import { useMutation } from "convex/react";
import type { FunctionArgs } from "convex/server";
import { useState } from "react";
import { isCommitmentValid } from "@/shared/lib/onboarding/commitments";
import { readFirstCycleError } from "@/shared/lib/onboarding/first-cycle-error";
import { isAllowedPayDate, NEXT_PAY_DATE_MESSAGE } from "@/shared/lib/onboarding/pay-date";
import { buildOnboardingPayload } from "@/shared/lib/onboarding/payload";
import type { CycleFieldErrors, DraftCommitment } from "@/shared/lib/onboarding/types";
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

function setFieldError(
	dispatch: ReturnType<typeof useOnboarding>["dispatch"],
	errors: CycleFieldErrors,
) {
	dispatch({ type: "UPDATE", payload: { cycleFieldErrors: errors } });
}

export function useCompleteOnboarding() {
	const { state, dispatch } = useOnboarding();
	const createProfile = useMutation(api.profiles.createProfile);
	const createBulk = useMutation(api.fixedCommitments.createCommitmentsBulk);
	const startFirstCycle = useMutation(api.firstCycle.startFirstCycle);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [commitmentsFailed, setCommitmentsFailed] = useState(false);

	async function submit() {
		setIsSubmitting(true);
		setError(null);
		setCommitmentsFailed(false);
		setFieldError(dispatch, {});
		const nextPayDate = state.nextPayDate;
		if (!nextPayDate || !isAllowedPayDate(nextPayDate, Date.now())) {
			setFieldError(dispatch, { nextPayDate: NEXT_PAY_DATE_MESSAGE });
			setIsSubmitting(false);
			return false;
		}
		const openingBalanceCents = state.referenceIncomeCents ?? 0;
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
			try {
				await startFirstCycle({ openingBalanceCents, nextPayDate });
			} catch (cycleError) {
				const failure = readFirstCycleError(cycleError);
				if (failure.code === "ALREADY_EXISTS") return true;
				if (failure.code === "VALIDATION_ERROR") {
					setFieldError(dispatch, { [failure.field]: failure.message });
					return false;
				}
				setError(failure.message);
				return false;
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
