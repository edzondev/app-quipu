import { describe, expect, it } from "vitest";
import { formatCents, parseToCents } from "./money";

describe("formatCents", () => {
	it("uses locale and symbol for PEN", () => {
		const label = formatCents(123456, { currency: "PEN" });
		expect(label).toMatch(/1[,.]234[,.]56/);
		expect(label).toMatch(/S\/|PEN/);
	});

	it("uses locale for EUR and USD", () => {
		const eur = formatCents(499, { currency: "EUR" });
		const usd = formatCents(499, { currency: "USD" });
		expect(eur).toMatch(/4[,.]99/);
		expect(usd).toMatch(/4[,.]99/);
	});

	it("defaults to PEN when currency omitted", () => {
		const label = formatCents(100, {});
		expect(label).toMatch(/1[,.]00/);
	});
});

describe("parseToCents", () => {
	it("parses decimal and currency-prefixed input", () => {
		expect(parseToCents("14.90")).toBe(1490);
		expect(parseToCents("S/ 14.90")).toBe(1490);
		expect(parseToCents("€4,99")).toBe(499);
	});
});
