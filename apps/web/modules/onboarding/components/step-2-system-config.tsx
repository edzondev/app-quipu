"use client";

import { useOnboarding } from "./onboarding-provider";
import { Step2Fixed } from "./step-2-fixed";
import { Step2Mixed } from "./step-2-mixed";
import { Step2Variable } from "./step-2-variable";

type Props = {
	onBack: VoidFunction;
	onNext: VoidFunction;
	onStepCompleted: VoidFunction;
};

export function Step2SystemConfig({ onBack, onNext, onStepCompleted }: Props) {
	const { state } = useOnboarding();

	function handleNext() {
		onStepCompleted();
		onNext();
	}

	switch (state.incomeModel) {
		case "variable":
			return <Step2Variable onBack={onBack} onNext={handleNext} />;
		case "mixed":
			return <Step2Mixed onBack={onBack} onNext={handleNext} />;
		default:
			return <Step2Fixed onBack={onBack} onNext={handleNext} />;
	}
}
