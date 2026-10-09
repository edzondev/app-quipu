import { Redirect, router, useIsFocused } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { Welcome } from "@/modules/onboarding/components/welcome";
import { AuthNotice } from "@/shared/components/auth/auth-notice";
import { useProfileGate } from "@/shared/hooks/use-profile-gate";
import { takeOfflineSignOutNotice } from "@/shared/lib/auth/device-session";

export default function OnboardingIndexScreen() {
	const { isAuthReady, isLoading, profile } = useProfileGate();
	const focused = useIsFocused();
	const [offlineNotice] = useState(takeOfflineSignOutNotice);

	useEffect(() => {
		if (focused && isAuthReady && profile?.onboardingComplete) {
			router.replace("/(tabs)");
		}
	}, [focused, isAuthReady, profile]);

	// Sesión/token aún restaurándose en cold start: no decidir todavía.
	if (isLoading) return null;

	// Sin sesión: la intro es la puerta de entrada al onboarding.
	if (!isAuthReady) {
		return (
			<View className="flex-1 bg-background px-0 pt-16">
				{offlineNotice ? (
					<View className="px-6">
						<AuthNotice tone="warning" message={offlineNotice} />
					</View>
				) : null}
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
