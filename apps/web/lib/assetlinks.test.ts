import { describe, expect, it } from "vitest";
import { buildAssetLinks } from "./assetlinks";

const FINGERPRINT_A =
	"AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99";
const FINGERPRINT_B =
	"11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00";

describe("buildAssetLinks", () => {
	it("builds one android_app statement from package and colon-hex fingerprints", () => {
		expect(
			buildAssetLinks({
				packageName: "com.quipu.finance",
				fingerprints: `${FINGERPRINT_A}, ${FINGERPRINT_B}`,
			}),
		).toEqual([
			{
				relation: [
					"delegate_permission/common.handle_all_urls",
					"delegate_permission/common.get_login_creds",
				],
				target: {
					namespace: "android_app",
					package_name: "com.quipu.finance",
					sha256_cert_fingerprints: [FINGERPRINT_A, FINGERPRINT_B],
				},
			},
		]);
	});

	it("uses the package argument and does not invent one", () => {
		const statements = buildAssetLinks({
			packageName: "com.example.other",
			fingerprints: FINGERPRINT_A,
		});

		expect(statements?.[0]?.target.package_name).toBe("com.example.other");
	});

	it("returns null when fingerprints are missing so the route can 404", () => {
		expect(buildAssetLinks({ packageName: "com.quipu.finance", fingerprints: undefined })).toBe(
			null,
		);
		expect(buildAssetLinks({ packageName: "com.quipu.finance", fingerprints: "" })).toBe(null);
		expect(buildAssetLinks({ packageName: "com.quipu.finance", fingerprints: " , " })).toBe(null);
	});

	it("returns null when the package is missing", () => {
		expect(buildAssetLinks({ packageName: undefined, fingerprints: FINGERPRINT_A })).toBe(null);
		expect(buildAssetLinks({ packageName: "  ", fingerprints: FINGERPRINT_A })).toBe(null);
	});

	it("drops fingerprints that are not 32 colon-separated hex bytes", () => {
		expect(
			buildAssetLinks({
				packageName: "com.quipu.finance",
				fingerprints: `not-a-fingerprint,${FINGERPRINT_A.toLowerCase()}`,
			}),
		).toEqual([
			expect.objectContaining({
				target: expect.objectContaining({
					sha256_cert_fingerprints: [FINGERPRINT_A.toLowerCase()],
				}),
			}),
		]);

		expect(
			buildAssetLinks({
				packageName: "com.quipu.finance",
				fingerprints: FINGERPRINT_A.replaceAll(":", ""),
			}),
		).toBe(null);
	});
});
