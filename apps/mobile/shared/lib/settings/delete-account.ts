import { authClient } from "@/lib/auth-client";
import { ACTION_TIMEOUT_MS, assertOnline, withTimeout } from "@/shared/lib/network/await-online";

export const DELETE_ACCOUNT_ERROR = "No pudimos eliminar tu cuenta. Intenta de nuevo.";
export const DELETE_ACCOUNT_ERROR_REAUTH =
	"Por seguridad, confirma con passkey o escribe tu contraseña.";
export const DELETE_ACCOUNT_ERROR_PASSWORD = "La contraseña no es correcta.";
export const DELETE_ACCOUNT_ERROR_OTP = "El código no es correcto. Pide uno nuevo.";
export const DELETE_ACCOUNT_ERROR_POLAR_ACTIVE =
	"Tienes una suscripción activa. Cancélala primero desde la web en quipu-finance.app y luego podrás eliminar tu cuenta.";
export const DELETE_ACCOUNT_ERROR_POLAR_UNAVAILABLE =
	"No pudimos revisar tu plan. Inténtalo de nuevo.";
export const DELETE_ACCOUNT_OTP_SENT = "Te enviamos un código a tu correo para confirmar.";

type AuthClientError = {
	code?: string | undefined;
	message?: string | undefined;
};

type DeleteAccountSuccess = { ok: true };
type DeleteAccountFailure = {
	ok: false;
	message: string;
	code?: string;
	needsOtp?: boolean;
};

export type DeleteAccountResult = DeleteAccountSuccess | DeleteAccountFailure;

function isStaleSessionError(error: AuthClientError): boolean {
	const code = error.code?.toUpperCase() ?? "";
	const message = error.message?.toLowerCase() ?? "";
	return (
		code === "SESSION_EXPIRED" ||
		code === "SESSION_NOT_FRESH" ||
		message.includes("session expired") ||
		message.includes("session is not fresh") ||
		message.includes("re-authenticate")
	);
}

function isInvalidPasswordError(error: AuthClientError): boolean {
	const code = error.code?.toUpperCase() ?? "";
	const message = error.message?.toLowerCase() ?? "";
	return (
		code === "INVALID_PASSWORD" ||
		code === "CREDENTIAL_ACCOUNT_NOT_FOUND" ||
		message.includes("invalid password") ||
		message.includes("credential account")
	);
}

function isInvalidOtpError(error: AuthClientError): boolean {
	const code = error.code?.toUpperCase() ?? "";
	const message = error.message?.toLowerCase() ?? "";
	return (
		code === "INVALID_OTP" ||
		code === "OTP_EXPIRED" ||
		code === "TOO_MANY_ATTEMPTS" ||
		message.includes("invalid otp") ||
		message.includes("otp expired")
	);
}

export const DELETE_ACCOUNT_PASSWORD_LABEL = "Contraseña (si usas una)";
export const DELETE_ACCOUNT_PASSWORD_PLACEHOLDER = "Opcional si acabas de entrar";
export const DELETE_ACCOUNT_OTP_LABEL = "Código del correo";
export const DELETE_ACCOUNT_OTP_PLACEHOLDER = "6 dígitos";

function failure(error: AuthClientError, extra?: { needsOtp?: boolean }): DeleteAccountFailure {
	return {
		ok: false,
		message: mapDeleteAccountError(error),
		code: error.code,
		...extra,
	};
}

export function mapDeleteAccountError(error: AuthClientError): string {
	const code = error.code?.toUpperCase() ?? "";
	if (code === "POLAR_SUBSCRIPTION_ACTIVE") {
		return DELETE_ACCOUNT_ERROR_POLAR_ACTIVE;
	}
	if (code === "POLAR_STATUS_UNAVAILABLE") {
		return DELETE_ACCOUNT_ERROR_POLAR_UNAVAILABLE;
	}
	if (isInvalidOtpError(error)) {
		return DELETE_ACCOUNT_ERROR_OTP;
	}
	if (isStaleSessionError(error)) {
		return DELETE_ACCOUNT_ERROR_REAUTH;
	}
	if (isInvalidPasswordError(error)) {
		return DELETE_ACCOUNT_ERROR_PASSWORD;
	}
	return DELETE_ACCOUNT_ERROR;
}

type NetworkGuard = <T>(work: () => Promise<T>) => Promise<T>;

async function sendDeleteAccountOtp(
	email: string,
	guard: NetworkGuard,
): Promise<DeleteAccountResult> {
	const sent = await guard(() =>
		authClient.emailOtp.sendVerificationOtp({
			email,
			type: "sign-in",
		}),
	);
	if (sent.error) {
		return failure(sent.error);
	}
	return {
		ok: false,
		needsOtp: true,
		message: DELETE_ACCOUNT_OTP_SENT,
	};
}

/**
 * Same Better Auth `/delete-user` flow as web (`apps/web/modules/settings/lib/delete-account.ts`).
 * Fresh session or password; stale passkey sessions reauth once and retry.
 * OTP-only stale sessions reuse emailOTP sign-in to refresh, then deleteUser.
 * Convex cleanup runs in the server `onDelete` trigger — this client only calls deleteUser.
 */
export async function deleteAccount(options?: {
	password?: string;
	otp?: string;
	email?: string;
	canUsePasskey?: boolean;
	guard?: NetworkGuard;
}): Promise<DeleteAccountResult> {
	const password = options?.password?.trim();
	const otp = options?.otp?.trim();
	const email = options?.email?.trim().toLowerCase();
	const canUsePasskey = options?.canUsePasskey ?? false;
	const guard = options?.guard ?? ((work) => work());

	if (otp && email) {
		const signedIn = await authClient.signIn.emailOtp({ email, otp });
		if (signedIn.error) {
			return failure(signedIn.error, { needsOtp: true });
		}
		const deleted = await guard(() => authClient.deleteUser(undefined));
		if (!deleted.error) return { ok: true };
		return failure(deleted.error);
	}

	const first = await guard(() => authClient.deleteUser(password ? { password } : undefined));
	if (!first.error) return { ok: true };

	if (!password && canUsePasskey && isStaleSessionError(first.error)) {
		const passkey = await authClient.signIn.passkey();
		if (!passkey.error) {
			const second = await guard(() => authClient.deleteUser());
			if (!second.error) return { ok: true };
			return failure(second.error);
		}
		if (email) {
			return sendDeleteAccountOtp(email, guard);
		}
		return failure(first.error);
	}

	if (!password && email && isStaleSessionError(first.error)) {
		return sendDeleteAccountOtp(email, guard);
	}

	return failure(first.error);
}

/** Offline + timeout around deleteUser and email OTP. The passkey prompt is not timed. */
export async function deleteAccountOnDevice(options?: {
	password?: string;
	otp?: string;
	email?: string;
	canUsePasskey?: boolean;
}): Promise<DeleteAccountResult> {
	await assertOnline(DELETE_ACCOUNT_ERROR);
	return deleteAccount({
		...options,
		guard: (work) => withTimeout(work(), ACTION_TIMEOUT_MS, DELETE_ACCOUNT_ERROR),
	});
}
