import { describe, expect, it } from "vitest";
import {
	assertEmailAllowed,
	extractEmailDomain,
	isBlockedEmailDomain,
	validateEmailAllowed,
} from "./domainPolicy";

describe("domainPolicy", () => {
	it("allows legitimate Gmail addresses", () => {
		expect(validateEmailAllowed("testeruser@gmail.com")).toBe(true);
		expect(isBlockedEmailDomain("gmail.com")).toBe(false);
		expect(() => assertEmailAllowed("testeruser@gmail.com")).not.toThrow();
	});

	it("blocks disposable and typo Gmail domains", () => {
		expect(isBlockedEmailDomain("mailinator.com")).toBe(true);
		expect(isBlockedEmailDomain("gmxxail.com")).toBe(true);
		expect(isBlockedEmailDomain("gmai.com")).toBe(true);
		expect(isBlockedEmailDomain("gmai1.com")).toBe(true);
		expect(isBlockedEmailDomain("gnail.com")).toBe(true);
	});

	it("extracts domain case-insensitively", () => {
		expect(extractEmailDomain("User@Gmail.COM")).toBe("gmail.com");
	});
});
