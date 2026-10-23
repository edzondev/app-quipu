import { Stack } from "expo-router";
import "react-native-reanimated";
import "../global.css";
import { type AuthClient, ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { initialWindowMetrics, SafeAreaProvider } from "react-native-safe-area-context";
import { useUniwind } from "uniwind";
import { authClient } from "@/lib/auth-client";
import { createConvexClient, nextConvexClient, registerConvexReset } from "@/lib/convex";
import { useProfileGate } from "@/shared/hooks/use-profile-gate";
import { updateSpendableWidget } from "@/widgets/SpendableToday";

export { ErrorBoundary } from "expo-router";

export const unstable_settings = {
	initialRouteName: "(tabs)",
};

SplashScreen.setOptions({
	fade: true,
	duration: 1000,
});

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
	const { theme } = useUniwind();
	const [session, setSession] = useState(() => ({ epoch: 0, client: createConvexClient() }));
	useEffect(() => {
		return registerConvexReset(() => {
			setSession((current) => ({
				epoch: current.epoch + 1,
				client: nextConvexClient(current.client, createConvexClient),
			}));
		});
	}, []);

	return (
		<SafeAreaProvider initialMetrics={initialWindowMetrics}>
			<KeyboardProvider>
				<ConvexBetterAuthProvider
					key={session.epoch}
					client={session.client}
					authClient={authClient as unknown as AuthClient}
				>
					<SplashHider />
					<RootLayoutNav />
				</ConvexBetterAuthProvider>
				<StatusBar animated style={theme === "dark" ? "light" : "dark"} />
			</KeyboardProvider>
		</SafeAreaProvider>
	);
}

function SplashHider() {
	const { isAuthReady, isLoading } = useProfileGate();
	useEffect(() => {
		if (!isLoading) SplashScreen.hide();
	}, [isLoading]);
	// Home unmounts on sign-out, so it cannot clear the last amount itself.
	useEffect(() => {
		if (isLoading || isAuthReady) return;
		updateSpendableWidget({
			amountCents: null,
			currencySymbol: "S/",
			updatedAt: new Date(),
		});
	}, [isAuthReady, isLoading]);
	return null;
}

function RootLayoutNav() {
	return (
		<Stack>
			<Stack.Screen name="(tabs)" options={{ headerShown: false }} />
			<Stack.Screen name="(auth)" options={{ headerShown: false }} />
			<Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
			<Stack.Screen name="expense/[id]" options={{ headerShown: false }} />
			<Stack.Screen name="ajustes" options={{ presentation: "modal", headerShown: false }} />
			<Stack.Screen name="seguridad" options={{ headerShown: false }} />
		</Stack>
	);
}
