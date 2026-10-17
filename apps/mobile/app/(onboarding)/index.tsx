import { Redirect, router, useIsFocused, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { View } from "react-native";
import { Welcome } from "@/modules/onboarding/components/welcome";
import { AuthNotice } from "@/shared/components/auth/auth-notice";
import { useProfileGate } from "@/shared/hooks/use-profile-gate";
import { accountDeletedNotice, offlineSignOutNotice } from "@/shared/lib/auth/device-session";

export default function OnboardingIndexScreen() {
	const { isAuthReady, isLoading, profile } = useProfileGate();
	const focused = useIsFocused();
	const params = useLocalSearchParams<{ notice?: string }>();
	const deletedNotice = accountDeletedNotice(params.notice);
	const offlineNotice = offlineSignOutNotice(params.notice);
	const welcomeNotice = deletedNotice ?? offlineNotice;
	const welcomeTone = deletedNotice ? "info" : "warning";

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
				{welcomeNotice ? (
					<View className="px-6">
						<AuthNotice tone={welcomeTone} message={welcomeNotice} />
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
