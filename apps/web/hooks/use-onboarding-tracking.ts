/**
 * Tracking del wizard de onboarding.
 *
 * Emite los eventos de la fase 5:
 *   - `onboarding_started`           → al montar el wizard
 *   - `onboarding_step_viewed`       → al cambiar de paso
 *   - `onboarding_step_completed`    → al pulsar "Continuar" (en cada paso)
 *   - `onboarding_abandoned`         → al desmontar sin completar
 *
 * `onboarding_completed` se sigue emitiendo desde `step-3-allocation.tsx`
 * porque ese componente tiene el contexto completo de duración y
 * allocation. Este hook es complementario, no lo reemplaza.
 *
 * El tracking de "abandono" se hace con un `useEffect` cleanup que solo
 * dispara si el wizard no llegó al paso "success". En StrictMode el doble
 * mount en dev puede disparar el cleanup una vez; eso es aceptable.
 */

"use client";

import { useEffect, useRef } from "react";
import { AnalyticsEvents, type OnboardingStepProperties, track } from "@/core/analytics";

export type OnboardingStep = 1 | 2 | 3 | "success";

const STEP_ORDER: OnboardingStep[] = [1, 2, 3, "success"];

export function useOnboardingTracking(step: OnboardingStep): {
	markStepCompleted: (completed: OnboardingStep) => void;
} {
	const startedFiredRef = useRef<boolean>(false);
	const completedRef = useRef<boolean>(false);
	const highestStepRef = useRef<OnboardingStep>(step);

	useEffect(() => {
		if (!startedFiredRef.current) {
			track(AnalyticsEvents.ONBOARDING_STARTED, {});
			startedFiredRef.current = true;
		}
	}, []);

	useEffect(() => {
		if (STEP_ORDER.indexOf(step) > STEP_ORDER.indexOf(highestStepRef.current)) {
			highestStepRef.current = step;
		}

		const props: OnboardingStepProperties = { step };
		track(AnalyticsEvents.ONBOARDING_STEP_VIEWED, props);
	}, [step]);

	useEffect(() => {
		if (step === "success") {
			completedRef.current = true;
		}
	}, [step]);

	useEffect(() => {
		return () => {
			if (completedRef.current) return;
			if (highestStepRef.current === "success") return;
			track(AnalyticsEvents.ONBOARDING_ABANDONED, {
				last_step: highestStepRef.current,
			});
		};
	}, []);

	return {
		markStepCompleted: (completed: OnboardingStep) => {
			const props: OnboardingStepProperties = { step: completed };
			track(AnalyticsEvents.ONBOARDING_STEP_COMPLETED, props);
		},
	};
}
