import { PASSKEY_ERROR_CODES } from "@better-auth/passkey";
import { APIError } from "better-auth/api";

type PasskeyRegistrationArgs = {
	context?: string | null;
};

/**
 * El plugin solo llama a esta función cuando no hay sesión. Con sesión usa
 * al usuario autenticado y no llega aquí. Rechazar siempre impide registrar
 * una passkey sobre una cuenta a partir de un email enviado por el cliente.
 */
export async function resolvePasskeyRegistrationUser(
	_args?: PasskeyRegistrationArgs,
): Promise<never> {
	throw APIError.from("UNAUTHORIZED", PASSKEY_ERROR_CODES.SESSION_REQUIRED);
}
