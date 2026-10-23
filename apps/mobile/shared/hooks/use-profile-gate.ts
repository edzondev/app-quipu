import { api } from "@quipu/convex-api";
import { useConvexAuth, useQuery } from "convex/react";
import { useEffect, useEffectEvent } from "react";
import { authClient } from "@/lib/auth-client";
import { clear as clearChosenBanks } from "@/modules/quipu-notification-listener";

export function useProfileGate() {
	const { data: session, isPending: isSessionPending } = authClient.useSession();
	const { isAuthenticated, isLoading: isConvexAuthPending } = useConvexAuth();

	// Convex recién tiene el token cuando la conexión quedó autenticada
	// (isAuthenticated) y no hay handshake en curso (isConvexAuthPending).
	const isAuthReady = isAuthenticated && !isConvexAuthPending;
	const profile = useQuery(api.profiles.getMyProfile, isAuthReady ? {} : "skip");

	const isLoading =
		isSessionPending || isConvexAuthPending || (isAuthReady && profile === undefined);

	const clearSignedOutBanks = useEffectEvent(() => {
		void clearChosenBanks().catch(() => undefined);
	});

	useEffect(() => {
		if (isLoading || isSessionPending || isAuthReady || session) return;
		clearSignedOutBanks();
	}, [isLoading, isSessionPending, isAuthReady, session]);

	return { isAuthReady, isLoading, profile };
}
