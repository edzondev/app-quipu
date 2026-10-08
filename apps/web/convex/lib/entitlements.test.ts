import { ConvexError } from "convex/values";
import { describe, expect, it } from "vitest";
import type { Doc } from "../_generated/dataModel";
import { assertAccountActive } from "./entitlements";

function profile(accountStatus: Doc<"profiles">["accountStatus"]): Doc<"profiles"> {
	return {
		accountStatus,
	} as Doc<"profiles">;
}

describe("assertAccountActive", () => {
	it("allows active and under_review accounts", () => {
		expect(() => assertAccountActive(profile(undefined))).not.toThrow();
		expect(() => assertAccountActive(profile("active"))).not.toThrow();
		expect(() => assertAccountActive(profile("under_review"))).not.toThrow();
	});

	it("blocks suspended accounts with ACCOUNT_SUSPENDED", () => {
		try {
			assertAccountActive(profile("suspended"));
			expect.unreachable();
		} catch (error) {
			expect(error).toBeInstanceOf(ConvexError);
			expect((error as ConvexError<{ code: string }>).data.code).toBe("ACCOUNT_SUSPENDED");
		}
	});
});
