"use client";

import { createContext, type ReactNode, useContext, useEffect, useMemo, useReducer } from "react";
import { ONBOARDING_DEFAULTS, STORAGE_KEY } from "../constants";
import type { OnboardingAction, OnboardingState } from "../types";

type Ctx = {
	state: OnboardingState;
	dispatch: React.Dispatch<OnboardingAction>;
};
const OnboardingContext = createContext<Ctx | null>(null);

function reducer(state: OnboardingState, action: OnboardingAction): OnboardingState {
	switch (action.type) {
		case "UPDATE":
			return { ...state, ...action.payload };
		case "RESET":
			return { ...ONBOARDING_DEFAULTS };
		case "HYDRATE":
			return { ...state, ...action.payload };
		default:
			return state;
	}
}

export function OnboardingProvider({ children }: { children: ReactNode }) {
	const [state, dispatch] = useReducer(reducer, ONBOARDING_DEFAULTS);

	// Hydrate from sessionStorage post-mount only — server can't read
	// sessionStorage, so reading in lazy init causes a hydration mismatch.
	useEffect(() => {
		try {
			const saved = sessionStorage.getItem(STORAGE_KEY);
			if (saved) {
				dispatch({ type: "HYDRATE", payload: JSON.parse(saved) });
			}
		} catch {
			// ignore corrupt data
		}
	}, []);

	useEffect(() => {
		try {
			sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
		} catch {
			// storage full
		}
	}, [state]);

	const value = useMemo(() => ({ state, dispatch }), [state]);

	return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding(): Ctx {
	const ctx = useContext(OnboardingContext);
	if (!ctx) throw new Error("useOnboarding must be used within OnboardingProvider");
	return ctx;
}
