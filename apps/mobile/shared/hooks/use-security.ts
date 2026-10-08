import { api } from "@quipu/convex-api";
import { useMutation, useQuery } from "convex/react";
import { authClient } from "@/lib/auth-client";
import { presentSecurity } from "@/shared/lib/settings/security-model";
import { useProfileGate } from "./use-profile-gate";

const ADD_PASSKEY_ERROR = "No pudimos agregar la Passkey. Intenta de nuevo.";
const DELETE_PASSKEY_ERROR = "No pudimos eliminar la Passkey. Intenta de nuevo.";
const SIGN_OUT_ERROR = "No pudimos cerrar la sesión en este dispositivo. Intenta de nuevo.";

async function addPasskey() {
	const result = await authClient.passkey.addPasskey();
	if (result.error) throw new Error(ADD_PASSKEY_ERROR);
}

async function deletePasskey(id: string) {
	const result = await authClient.passkey.deletePasskey({ id });
	if (result.error) throw new Error(DELETE_PASSKEY_ERROR);
}

export function useSecurity() {
	const { isAuthReady } = useProfileGate();
	const args = isAuthReady ? {} : ("skip" as const);
	const passkeys = useQuery(api.settings.listMyPasskeys, args);
	const sessions = useQuery(api.settings.listMySessions, args);
	const overview = useQuery(api.settings.getSettingsOverview, args);
	const revokeMySession = useMutation(api.settings.revokeMySession);
	const revokeAllSessions = useMutation(api.settings.revokeAllSessions);

	const settled =
		isAuthReady && passkeys !== undefined && sessions !== undefined && overview !== undefined;
	const hasData = settled && passkeys != null && sessions != null && overview != null;

	async function revokeAllAndSignOut() {
		await revokeAllSessions({});
		const result = await authClient.signOut();
		if (result.error) throw new Error(SIGN_OUT_ERROR);
	}

	const actions = {
		addPasskey,
		deletePasskey,
		revokeSession: (sessionId: string) => revokeMySession({ sessionId }),
		revokeAllAndSignOut,
	};

	if (!hasData || passkeys == null || sessions == null || overview == null) {
		return {
			status: settled ? ("empty" as const) : ("loading" as const),
			model: null,
			...actions,
		};
	}

	return {
		status: "ready" as const,
		model: presentSecurity({
			passkeys,
			sessions,
			backup: overview.security,
			now: Date.now(),
		}),
		...actions,
	};
}
