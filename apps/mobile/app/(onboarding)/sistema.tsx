import { Redirect } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { Step1IncomeProfile } from "@/modules/onboarding/components/step-1-income-profile";
import { Step3Allocation } from "@/modules/onboarding/components/step-3-allocation";
import { Step4Commitments } from "@/modules/onboarding/components/step-4-commitments";
import { StepConfirm } from "@/modules/onboarding/components/step-confirm";
import { OnboardingProvider, useOnboarding } from "@/modules/onboarding/onboarding-provider";
import { useProfileGate } from "@/shared/hooks/use-profile-gate";

export function SistemaWizard() {
	const { state } = useOnboarding();

	switch (state.step) {
		case 1:
			return <Step1IncomeProfile />;
		case 2:
			return <Step3Allocation />;
		case 3:
			return <Step4Commitments />;
		case 4:
			return <StepConfirm />;
	}
}

export default function SistemaScreen() {
	const { isAuthReady, isLoading, profile } = useProfileGate();
	const [sessionLive, setSessionLive] = useState(false);

	if (!sessionLive && !isLoading && isAuthReady && !profile?.onboardingComplete) {
		setSessionLive(true);
	}

	if (isLoading) return null;
	if (!isAuthReady) return <Redirect href="/(auth)/sign-in" />;
	if (profile?.onboardingComplete && !sessionLive) return <Redirect href="/(tabs)" />;

	return (
		<OnboardingProvider>
			<View className="flex-1 bg-background">
				<SistemaWizard />
			</View>
		</OnboardingProvider>
	);
}
