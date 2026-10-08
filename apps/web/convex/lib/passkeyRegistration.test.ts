import { APIError } from "better-auth/api";
import { describe, expect, it } from "vitest";
import { resolvePasskeyRegistrationUser } from "./passkeyRegistration";

describe("resolvePasskeyRegistrationUser", () => {
	it("rechaza el registro sin sesión aunque el cliente envíe un email", async () => {
		const contexts: Array<string | null | undefined> = ["victima@example.com", "", null, undefined];

		for (const context of contexts) {
			const attempt = resolvePasskeyRegistrationUser({ context });
			await expect(attempt).rejects.toBeInstanceOf(APIError);
			await expect(attempt).rejects.toMatchObject({
				status: "UNAUTHORIZED",
				statusCode: 401,
				body: { code: "SESSION_REQUIRED" },
			});
		}
	});
});
