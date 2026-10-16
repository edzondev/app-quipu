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

	it("does not lose a cent on float-unsafe two-decimal amounts", () => {
		expect(parseToCents("10.05")).toBe(1005);
		expect(parseToCents("1.15")).toBe(115);
		expect(parseToCents("4.10")).toBe(410);
		expect(parseToCents("19.99")).toBe(1999);
		expect(parseToCents("0.29")).toBe(29);
	});

	it("rounds a third decimal to the nearest cent without float multiply", () => {
		expect(parseToCents("1.005")).toBe(101);
		expect(parseToCents("1.004")).toBe(100);
		expect(parseToCents("2.675")).toBe(268);
	});

	it("keeps every two-decimal amount from 0.00 to 200.00 exact", () => {
		for (let cents = 0; cents <= 20_000; cents++) {
			const raw = (cents / 100).toFixed(2);
			expect(parseToCents(raw)).toBe(cents);
		}
	});

	it("rejects a leading minus instead of rounding it the wrong way", () => {
		expect(parseToCents("-10.05")).toBeNull();
		expect(parseToCents("-1.15")).toBeNull();
	});
});
