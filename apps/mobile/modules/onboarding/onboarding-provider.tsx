import {
	createContext,
	type Dispatch,
	type ReactNode,
	useContext,
	useMemo,
	useReducer,
} from "react";
import { ONBOARDING_DEFAULTS } from "@/shared/lib/onboarding/defaults";
import type { OnboardingAction, OnboardingState } from "@/shared/lib/onboarding/types";
import { onboardingReducer } from "./state";

type OnboardingContextValue = {
	state: OnboardingState;
	dispatch: Dispatch<OnboardingAction>;
};

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
	const [state, dispatch] = useReducer(onboardingReducer, ONBOARDING_DEFAULTS);
	const value = useMemo(() => ({ state, dispatch }), [state]);
	return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding(): OnboardingContextValue {
	const ctx = useContext(OnboardingContext);
	if (!ctx) {
		throw new Error("useOnboarding debe usarse dentro de <OnboardingProvider>");
	}
	return ctx;
}
