import { expoClient } from "@better-auth/expo/client";
import { convexClient } from "@convex-dev/better-auth/client/plugins";
import type { BetterAuthClientPlugin } from "better-auth/client";
import { emailOTPClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { expoPasskeyClient } from "expo-better-auth-passkey";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";

const schemeConfig = Constants.expoConfig?.scheme;
const scheme = (Array.isArray(schemeConfig) ? schemeConfig[0] : schemeConfig) ?? "quipu";

const expoPasskey = expoPasskeyClient();
type PluginFetch = Parameters<NonNullable<BetterAuthClientPlugin["getActions"]>>[0];
type PluginAtoms = Parameters<NonNullable<BetterAuthClientPlugin["getAtoms"]>>[0];

// expo-better-auth-passkey types BetterFetch from another @better-fetch copy, so
// the raw plugin is not assignable and createAuthClient drops plugin inference.
const passkeyClientPlugin = {
	id: expoPasskey.id,
	$InferServerPlugin: expoPasskey.$InferServerPlugin,
	pathMethods: expoPasskey.pathMethods,
	atomListeners: expoPasskey.atomListeners,
	getAtoms: ($fetch: PluginAtoms) =>
		expoPasskey.getAtoms($fetch as Parameters<(typeof expoPasskey)["getAtoms"]>[0]),
	getActions: (
		$fetch: PluginFetch,
		$store: Parameters<NonNullable<BetterAuthClientPlugin["getActions"]>>[1],
	) => expoPasskey.getActions($fetch as Parameters<(typeof expoPasskey)["getActions"]>[0], $store),
} satisfies BetterAuthClientPlugin;

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
		passkeyClientPlugin,
	],
});
