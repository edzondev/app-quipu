import { describe, expect, it } from "vitest";
import { appendAuthReturnTo, resolveAuthDestination, sanitizeAuthReturnTo } from "./auth-return-to";

describe("sanitizeAuthReturnTo", () => {
	it("allows internal paths", () => {
		expect(sanitizeAuthReturnTo("/espacios/unirse/abc")).toBe("/espacios/unirse/abc");
	});

	it("rejects external and protocol-relative URLs", () => {
		expect(sanitizeAuthReturnTo("https://evil.test")).toBeNull();
		expect(sanitizeAuthReturnTo("//evil.test")).toBeNull();
	});
});

describe("resolveAuthDestination", () => {
	it("falls back when returnTo is unsafe", () => {
		expect(resolveAuthDestination("//evil", "/dashboard")).toBe("/dashboard");
	});
});

describe("appendAuthReturnTo", () => {
	it("appends next query param", () => {
		expect(appendAuthReturnTo("/sign-in", "/espacios/unirse/tok")).toBe(
			"/sign-in?next=%2Fespacios%2Funirse%2Ftok",
		);
	});
});
