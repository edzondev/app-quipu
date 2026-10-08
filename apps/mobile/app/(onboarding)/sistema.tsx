import { Redirect } from "expo-router";
import { View } from "react-native";
import { Step1IncomeProfile } from "@/modules/onboarding/components/step-1-income-profile";
import { Step2System } from "@/modules/onboarding/components/step-2-system";
import { Step3Allocation } from "@/modules/onboarding/components/step-3-allocation";
import { Step4Commitments } from "@/modules/onboarding/components/step-4-commitments";
import { StepConfirm } from "@/modules/onboarding/components/step-confirm";
import { StepSuccess } from "@/modules/onboarding/components/step-success";
import { OnboardingProvider, useOnboarding } from "@/modules/onboarding/onboarding-provider";
import { useProfileGate } from "@/shared/hooks/use-profile-gate";

function SistemaWizard() {
	const { state } = useOnboarding();

	switch (state.step) {
		case 1:
			return <Step1IncomeProfile />;
		case 2:
			return <Step2System />;
		case 3:
			return <Step3Allocation />;
		case 4:
			return <Step4Commitments />;
		case "confirm":
			return <StepConfirm />;
		case "success":
			return <StepSuccess />;
	}
}

export default function SistemaScreen() {
	const { isAuthReady, isLoading, profile } = useProfileGate();

	if (isLoading) return null;
	if (!isAuthReady) return <Redirect href="/(auth)/sign-in" />;
	if (profile?.onboardingComplete) return <Redirect href="/(tabs)" />;

	return (
		<OnboardingProvider>
			<View className="flex-1 bg-background">
				<SistemaWizard />
			</View>
		</OnboardingProvider>
	);
}
