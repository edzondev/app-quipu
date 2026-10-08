import { describe, expect, it } from "vitest";
import { androidApkKeyHashOrigins } from "./passkeyOrigins";

describe("androidApkKeyHashOrigins", () => {
	it("prefixes each bare base64url value", () => {
		expect(androidApkKeyHashOrigins("abc_-123, def456")).toEqual([
			"android:apk-key-hash:abc_-123",
			"android:apk-key-hash:def456",
		]);
	});

	it("returns no origins when the env value is empty", () => {
		expect(androidApkKeyHashOrigins(undefined)).toEqual([]);
		expect(androidApkKeyHashOrigins("")).toEqual([]);
		expect(androidApkKeyHashOrigins(" , ")).toEqual([]);
	});
});
