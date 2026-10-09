import * as SecureStore from "expo-secure-store";
import { authClient, authStoragePrefix } from "@/lib/auth-client";
import { resetConvexClient } from "@/lib/convex";
import { signOutAndClearDevice } from "@/shared/lib/auth/device-session";

export function signOutAndClearLocalData(): Promise<void> {
	return signOutAndClearDevice({
		storagePrefix: authStoragePrefix,
		signOut: () => authClient.signOut(),
		readSecure: (key) => SecureStore.getItemAsync(key),
		deleteSecure: (key) => SecureStore.deleteItemAsync(key),
		resetConvex: resetConvexClient,
	});
}
