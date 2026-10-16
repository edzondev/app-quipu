import { authClient } from "@/auth/auth-client";
import {
	SETTINGS_DELETE_ACCOUNT_ERROR,
	SETTINGS_DELETE_ACCOUNT_ERROR_OTP,
	SETTINGS_DELETE_ACCOUNT_ERROR_PASSWORD,
	SETTINGS_DELETE_ACCOUNT_ERROR_POLAR,
	SETTINGS_DELETE_ACCOUNT_ERROR_REAUTH,
	SETTINGS_DELETE_ACCOUNT_OTP_SENT,
} from "../constants";

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

function isPolarCancelError(error: AuthClientError): boolean {
	const code = error.code?.toUpperCase() ?? "";
	const message = error.message?.toLowerCase() ?? "";
	return code === "POLAR_CANCEL_FAILED" || message.includes("cancelar tu suscripción");
}

function failure(error: AuthClientError): DeleteAccountFailure {
	return {
		ok: false,
		message: mapDeleteAccountError(error),
		code: error.code,
	};
}

export function mapDeleteAccountError(error: AuthClientError): string {
	if (isPolarCancelError(error)) {
		return SETTINGS_DELETE_ACCOUNT_ERROR_POLAR;
	}
	if (isInvalidOtpError(error)) {
		return SETTINGS_DELETE_ACCOUNT_ERROR_OTP;
	}
	if (isStaleSessionError(error)) {
		return SETTINGS_DELETE_ACCOUNT_ERROR_REAUTH;
	}
	if (isInvalidPasswordError(error)) {
		return SETTINGS_DELETE_ACCOUNT_ERROR_PASSWORD;
	}
	return SETTINGS_DELETE_ACCOUNT_ERROR;
}

async function sendDeleteAccountOtp(email: string): Promise<DeleteAccountResult> {
	const sent = await authClient.emailOtp.sendVerificationOtp({
		email,
		type: "sign-in",
	});
	if (sent.error) {
		return failure(sent.error);
	}
	return {
		ok: false,
		needsOtp: true,
		message: SETTINGS_DELETE_ACCOUNT_OTP_SENT,
	};
}

/**
 * Better Auth exige sesión "fresh" (creada < freshAge, default 24h) o
 * contraseña para `/delete-user`. Sin eso responde SESSION_EXPIRED.
 *
 * Flujo: intentar borrar → si la sesión es vieja, passkey o OTP de correo
 * (cuentas sin contraseña) y reintentar. Polar se cancela en beforeDelete.
 */
export async function deleteAccount(options?: {
	password?: string;
	otp?: string;
	email?: string;
	canUsePasskey?: boolean;
	hasPassword?: boolean;
}): Promise<DeleteAccountResult> {
	const password = options?.password?.trim();
	const otp = options?.otp?.trim();
	const email = options?.email?.trim().toLowerCase();
	const canUsePasskey = options?.canUsePasskey ?? false;
	const passwordAccount = options?.hasPassword === true;

	if (otp && email) {
		const signedIn = await authClient.signIn.emailOtp({ email, otp });
		if (signedIn.error) {
			return failure(signedIn.error);
		}
		const deleted = await authClient.deleteUser(undefined);
		if (!deleted.error) return { ok: true };
		return failure(deleted.error);
	}

	const first = await authClient.deleteUser(password ? { password } : undefined);
	if (!first.error) return { ok: true };

	if (!password && canUsePasskey && isStaleSessionError(first.error)) {
		const passkey = await authClient.signIn.passkey();
		if (!passkey.error) {
			const second = await authClient.deleteUser();
			if (!second.error) return { ok: true };
			return failure(second.error);
		}
		if (!passwordAccount && email) {
			return sendDeleteAccountOtp(email);
		}
		return failure(first.error);
	}

	if (!passwordAccount && email && isStaleSessionError(first.error)) {
		return sendDeleteAccountOtp(email);
	}

	return failure(first.error);
}
