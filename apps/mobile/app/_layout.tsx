import { Stack } from "expo-router";
// import * as SplashScreen from "expo-splash-screen";
import "react-native-reanimated";
import "../global.css";
import {
  type AuthClient,
  ConvexBetterAuthProvider,
} from "@convex-dev/better-auth/react";
import { ConvexReactClient } from "convex/react";
import { StatusBar } from "expo-status-bar";
import { KeyboardProvider } from "react-native-keyboard-controller";
import {
  initialWindowMetrics,
  SafeAreaProvider,
} from "react-native-safe-area-context";
import { authClient } from "@/lib/auth-client";

export { ErrorBoundary } from "expo-router";

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL ?? "", {
  unsavedChangesWarning: false,
  expectAuth: true,
});

// Prevent the splash screen from auto-hiding before asset loading is complete.
// SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <KeyboardProvider>
        <ConvexBetterAuthProvider
          client={convex}
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
    </Stack>
  );
}
