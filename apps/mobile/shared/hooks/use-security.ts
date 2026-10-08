import { api } from "@quipu/convex-api";
import { useMutation, useQuery } from "convex/react";
import { authClient } from "@/lib/auth-client";
import { isPasskeyCancelled } from "@/shared/lib/auth/errors";
import { presentSecurity, SECURITY_ERROR } from "@/shared/lib/settings/security-model";
import { useProfileGate } from "./use-profile-gate";

async function addPasskey() {
	const result = await authClient.passkey.addPasskey();
	if (!result.error || isPasskeyCancelled(result.error)) return;
	throw new Error(SECURITY_ERROR.add);
}

async function deletePasskey(id: string) {
	const result = await authClient.passkey.deletePasskey({ id });
	if (result.error) throw new Error(SECURITY_ERROR.remove);
}

export function useSecurity() {
	const { isAuthReady } = useProfileGate();
	const args = isAuthReady ? {} : ("skip" as const);
	const sessions = useQuery(api.settings.listMySessions, args);
	const overview = useQuery(api.settings.getSettingsOverview, args);
	const revokeMySession = useMutation(api.settings.revokeMySession);
	const revokeAllSessions = useMutation(api.settings.revokeAllSessions);

	const settled = isAuthReady && sessions !== undefined && overview !== undefined;
	const hasData = settled && sessions != null && overview != null;

	async function revokeAllAndSignOut(goToSignIn: () => void) {
		await revokeAllSessions({});
		try {
			await authClient.signOut();
		} finally {
			goToSignIn();
		}
	}

	const actions = {
		addPasskey,
		deletePasskey,
		revokeSession: (sessionId: string) => revokeMySession({ sessionId }),
		revokeAllAndSignOut,
	};

	if (!hasData || sessions == null || overview == null) {
		return {
			status: settled ? ("empty" as const) : ("loading" as const),
			model: null,
			...actions,
		};
	}

	return {
		status: "ready" as const,
		model: presentSecurity({
			security: overview.security,
			sessions,
			now: Date.now(),
		}),
		...actions,
	};
}
