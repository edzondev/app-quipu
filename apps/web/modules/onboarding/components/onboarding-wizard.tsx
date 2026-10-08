"use client";

import { useEffect, useState } from "react";
import { useOnboardingTracking } from "@/hooks/use-onboarding-tracking";
import { AnimatedView, type AnimatedViewDirection } from "@/shared/components/ui/animated-view";
import { OnboardingProvider } from "./onboarding-provider";
import { Step1IncomeProfile } from "./step-1-income-profile";
import { Step2SystemConfig } from "./step-2-system-config";
import { Step3Allocation } from "./step-3-allocation";
import { StepSuccess } from "./step-success";

type Step = 1 | 2 | 3 | "success";

const ONBOARDING_STARTED_KEY = "qp:onboarding:started_at";

function stampOnboardingStart(): void {
	if (typeof window === "undefined") return;
	try {
		const existing = window.sessionStorage.getItem(ONBOARDING_STARTED_KEY);
		if (existing) return;
		window.sessionStorage.setItem(ONBOARDING_STARTED_KEY, String(Date.now()));
	} catch {
		// sessionStorage no disponible; tracking funciona sin duración
	}
}

export function OnboardingWizard() {
	const [step, setStep] = useState<Step>(1);
	const [direction, setDirection] = useState<AnimatedViewDirection>("forward");
	const { markStepCompleted } = useOnboardingTracking(step);

	useEffect(() => {
		stampOnboardingStart();
	}, []);

	function goForward(next: Step) {
		setDirection("forward");
		setStep(next);
	}

	function goBack(prev: Step) {
		setDirection("back");
		setStep(prev);
	}

	return (
		<OnboardingProvider>
			<AnimatedView viewKey={step} direction={direction}>
				{step === 1 && (
					<Step1IncomeProfile
						onNext={() => goForward(2)}
						onStepCompleted={() => markStepCompleted(1)}
					/>
				)}
				{step === 2 && (
					<Step2SystemConfig
						onBack={() => goBack(1)}
						onNext={() => goForward(3)}
						onStepCompleted={() => markStepCompleted(2)}
					/>
				)}
				{step === 3 && (
					<Step3Allocation
						onBack={() => goBack(2)}
						onComplete={() => goForward("success")}
						onStepCompleted={() => markStepCompleted(3)}
					/>
				)}
				{step === "success" && <StepSuccess />}
			</AnimatedView>
		</OnboardingProvider>
	);
}
