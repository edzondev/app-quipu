import { api } from "@quipu/convex-api";
import { useConvexAuth, useQuery } from "convex/react";
import { useEffect, useEffectEvent, useRef } from "react";
import { authClient } from "@/lib/auth-client";
import { setPaused } from "@/modules/quipu-notification-listener";

export function useProfileGate() {
	const { data: session, isPending: isSessionPending } = authClient.useSession();
	const { isAuthenticated, isLoading: isConvexAuthPending } = useConvexAuth();

	// Convex recién tiene el token cuando la conexión quedó autenticada
	// (isAuthenticated) y no hay handshake en curso (isConvexAuthPending).
	const isAuthReady = isAuthenticated && !isConvexAuthPending;
	const profile = useQuery(api.profiles.getMyProfile, isAuthReady ? {} : "skip");

	const isLoading =
		isSessionPending || isConvexAuthPending || (isAuthReady && profile === undefined);

	const sent = useRef<boolean | null>(null);
	const applyPaused = useEffectEvent((paused: boolean) => {
		if (sent.current === paused) return;
		sent.current = paused;
		void setPaused(paused).catch(() => undefined);
	});

	useEffect(() => {
		if (isLoading) return;
		applyPaused(!(isAuthReady || session));
	}, [isLoading, isAuthReady, session]);

	return { isAuthReady, isLoading, profile };
}
