import * as SecureStore from "expo-secure-store";
import { authClient, authStoragePrefix } from "@/lib/auth-client";
import { resetConvexClient } from "@/lib/convex";
import { clearedAuthSession, signOutAndClearDevice } from "@/shared/lib/auth/device-session";

export function signOutAndClearLocalData() {
	return signOutAndClearDevice({
		storagePrefix: authStoragePrefix,
		signOut: async () => {
			const result = await authClient.signOut();
			if (result.error) throw result.error;
		},
		readSecure: (key) => SecureStore.getItemAsync(key),
		deleteSecure: (key) => SecureStore.deleteItemAsync(key),
		resetConvex: resetConvexClient,
		clearMemorySession: () => {
			const atom = authClient.$store.atoms.session;
			if (!atom) return;
			atom.set(clearedAuthSession(atom.get()));
		},
	});
}
