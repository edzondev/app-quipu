import { ConvexError } from "convex/values";
import { describe, expect, it } from "vitest";
import { assertDevCloudOnly, isDevCloudUrl } from "./devCloudGuard";

const DEV_URL = "https://perceptive-elk-229.convex.cloud";
const PROD_URL = "https://patient-chihuahua-640.convex.cloud";

describe("isDevCloudUrl", () => {
	it("accepts the dev deployment", () => {
		expect(isDevCloudUrl(DEV_URL)).toBe(true);
	});

	it("rejects production and a missing url", () => {
		expect(isDevCloudUrl(PROD_URL)).toBe(false);
		expect(isDevCloudUrl(undefined)).toBe(false);
		expect(isDevCloudUrl("")).toBe(false);
	});
});

describe("assertDevCloudOnly", () => {
	it("throws ConvexError outside the dev deployment", () => {
		expect(() => assertDevCloudOnly(PROD_URL)).toThrow(ConvexError);
		expect(() => assertDevCloudOnly(undefined)).toThrow(ConvexError);
	});

	it("allows the dev deployment", () => {
		expect(() => assertDevCloudOnly(DEV_URL)).not.toThrow();
	});
});
