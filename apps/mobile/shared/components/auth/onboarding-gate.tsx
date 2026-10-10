import { Redirect } from "expo-router";
import type { ReactNode } from "react";
import { useProfileGate } from "@/shared/hooks/use-profile-gate";
import { SIGNED_OUT_HREF } from "@/shared/lib/auth/device-session";

const ONBOARDING_SISTEMA = "/(onboarding)/sistema";

export default function OnboardingGate({ children }: { children: ReactNode }) {
	const { isAuthReady, isLoading, profile } = useProfileGate();

	if (isLoading) return null;

	if (!isAuthReady) return <Redirect href={SIGNED_OUT_HREF} />;
	if (!profile?.onboardingComplete) return <Redirect href={ONBOARDING_SISTEMA} />;
	return <>{children}</>;
}
