import { Stack } from "expo-router";
// import * as SplashScreen from "expo-splash-screen";
import "react-native-reanimated";
import "../global.css";
import { type AuthClient, ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { initialWindowMetrics, SafeAreaProvider } from "react-native-safe-area-context";
import { authClient } from "@/lib/auth-client";
import { createConvexClient, nextConvexClient, registerConvexReset } from "@/lib/convex";

export { ErrorBoundary } from "expo-router";

export const unstable_settings = {
	initialRouteName: "(tabs)",
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
// SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
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
					<RootLayoutNav />
				</ConvexBetterAuthProvider>
				<StatusBar animated style="dark" />
			</KeyboardProvider>
		</SafeAreaProvider>
	);
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
