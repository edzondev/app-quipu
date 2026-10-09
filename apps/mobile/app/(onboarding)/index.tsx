import { Redirect, router } from "expo-router";
import { useEffect } from "react";
import { View } from "react-native";
import { Welcome } from "@/modules/onboarding/components/welcome";
import { useProfileGate } from "@/shared/hooks/use-profile-gate";

export default function OnboardingIndexScreen() {
	const { isAuthReady, isLoading, profile } = useProfileGate();

	useEffect(() => {
		if (isAuthReady && profile?.onboardingComplete) {
			router.replace("/(tabs)");
		}
	}, [isAuthReady, profile]);

	// Sesión/token aún restaurándose en cold start: no decidir todavía.
	if (isLoading) return null;

	// Sin sesión: la intro es la puerta de entrada al onboarding.
	if (!isAuthReady) {
		return (
			<View className="flex-1 bg-background px-0 pt-16">
				<Welcome />
			</View>
		);
	}

	// Perfil sin onboarding completo: directo al wizard.
	if (!profile?.onboardingComplete) {
		return <Redirect href="/(onboarding)/sistema" />;
	}

	// Con onboarding completo el efecto navega a /(tabs).
	return null;
}
