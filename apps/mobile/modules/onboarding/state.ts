import { ONBOARDING_DEFAULTS } from "@/shared/lib/onboarding/defaults";
import type { OnboardingAction, OnboardingState } from "@/shared/lib/onboarding/types";

export function onboardingReducer(
	state: OnboardingState,
	action: OnboardingAction,
): OnboardingState {
	switch (action.type) {
		case "UPDATE":
			return { ...state, ...action.payload };
		case "SET_STEP":
			return { ...state, step: action.payload };
		case "ADD_COMMITMENT":
			return { ...state, commitments: [...state.commitments, action.payload] };
		case "REMOVE_COMMITMENT":
			return {
				...state,
				commitments: state.commitments.filter((c) => c.id !== action.payload),
			};
		case "UPDATE_COMMITMENT":
			return {
				...state,
				commitments: state.commitments.map((c) =>
					c.id === action.payload.id ? action.payload : c,
				),
			};
		case "RESET":
			return { ...ONBOARDING_DEFAULTS };
	}
}
