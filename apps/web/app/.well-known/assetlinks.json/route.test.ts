import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

const FINGERPRINT =
	"AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99";

describe("GET /.well-known/assetlinks.json", () => {
	afterEach(() => {
		vi.unstubAllEnvs();
	});

	it("returns 404 application/json when fingerprints are missing", async () => {
		vi.stubEnv("ANDROID_PACKAGE", "com.quipu.finance");
		vi.stubEnv("ANDROID_SHA256_CERT_FINGERPRINTS", "");

		const response = GET();

		expect(response.status).toBe(404);
		expect(response.headers.get("content-type")).toMatch(/application\/json/);
		await expect(response.json()).resolves.toEqual({ error: "assetlinks_unconfigured" });
	});

	it("returns the statement when package and fingerprints are set", async () => {
		vi.stubEnv("ANDROID_PACKAGE", "com.quipu.finance");
		vi.stubEnv("ANDROID_SHA256_CERT_FINGERPRINTS", FINGERPRINT);

		const response = GET();

		expect(response.status).toBe(200);
		expect(response.headers.get("content-type")).toMatch(/application\/json/);
		await expect(response.json()).resolves.toEqual([
			{
				relation: [
					"delegate_permission/common.handle_all_urls",
					"delegate_permission/common.get_login_creds",
				],
				target: {
					namespace: "android_app",
					package_name: "com.quipu.finance",
					sha256_cert_fingerprints: [FINGERPRINT],
				},
			},
		]);
	});
});
