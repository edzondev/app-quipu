import { expoClient } from "@better-auth/expo/client";
import { convexClient } from "@convex-dev/better-auth/client/plugins";
import { emailOTPClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { expoPasskeyClient } from "expo-better-auth-passkey";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";

const schemeConfig = Constants.expoConfig?.scheme;
const scheme = (Array.isArray(schemeConfig) ? schemeConfig[0] : schemeConfig) ?? "quipu";

export const authClient = createAuthClient({
	baseURL: process.env.EXPO_PUBLIC_CONVEX_SITE_URL,
	plugins: [
		convexClient(),
		emailOTPClient(),
		expoClient({
			scheme,
			storagePrefix: scheme,
			storage: SecureStore,
		}),
		expoPasskeyClient(),
	],
});
