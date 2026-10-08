import { api } from "@quipu/convex-api";
import { useConvexAuth, useQuery } from "convex/react";
import { authClient } from "@/lib/auth-client";

export function useProfileGate() {
	const { isPending: isSessionPending } = authClient.useSession();
	const { isAuthenticated, isLoading: isConvexAuthPending } = useConvexAuth();

	// Convex recién tiene el token cuando la conexión quedó autenticada
	// (isAuthenticated) y no hay handshake en curso (isConvexAuthPending).
	const isAuthReady = isAuthenticated && !isConvexAuthPending;
	const profile = useQuery(api.profiles.getMyProfile, isAuthReady ? {} : "skip");

	const isLoading =
		isSessionPending || isConvexAuthPending || (isAuthReady && profile === undefined);

	return { isAuthReady, isLoading, profile };
}
