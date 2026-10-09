import { ConvexError } from "convex/values";
import { describe, expect, it } from "vitest";
import { assertDevSeedAllowed } from "./devSeedGuard";

const DEV_URL = "https://perceptive-elk-229.convex.cloud";
const PROD_URL = "https://patient-chihuahua-640.convex.cloud";

describe("assertDevSeedAllowed", () => {
	it("throws unless ALLOW_DEV_SEED is exactly true on the dev deployment", () => {
		expect(() => assertDevSeedAllowed({ allowDevSeed: undefined, cloudUrl: DEV_URL })).toThrow(
			ConvexError,
		);
		expect(() => assertDevSeedAllowed({ allowDevSeed: "false", cloudUrl: DEV_URL })).toThrow(
			ConvexError,
		);
		expect(() => assertDevSeedAllowed({ allowDevSeed: "TRUE", cloudUrl: DEV_URL })).toThrow(
			ConvexError,
		);
		expect(() => assertDevSeedAllowed({ allowDevSeed: "true", cloudUrl: PROD_URL })).toThrow(
			ConvexError,
		);
		expect(() => assertDevSeedAllowed({ allowDevSeed: "true", cloudUrl: undefined })).toThrow(
			ConvexError,
		);
	});

	it("allows the seed only when the flag is set and the cloud url is dev", () => {
		expect(() => assertDevSeedAllowed({ allowDevSeed: "true", cloudUrl: DEV_URL })).not.toThrow();
	});
});
