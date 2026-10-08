import { describe, expect, it } from "vitest";
import { getPlusAnnualSavingsPercent, getPlusPriceQuote, plusMonthlyPriceLabel } from "./plan";

describe("getPlusPriceQuote", () => {
	it("returns PEN monthly and yearly from Polar catalog", () => {
		expect(getPlusPriceQuote("PEN", "monthly")).toMatchObject({
			amountCents: 1490,
			priceLabel: "S/ 14.90/mes",
		});
		expect(getPlusPriceQuote("PEN", "yearly")).toMatchObject({
			amountCents: 11990,
			priceLabel: "S/ 119.90/año",
		});
	});

	it("returns EUR and USD quotes", () => {
		expect(getPlusPriceQuote("EUR", "monthly").priceInline).toBe("€4.99");
		expect(getPlusPriceQuote("USD", "yearly").priceInline).toBe("$39.99");
	});
});

describe("getPlusAnnualSavingsPercent", () => {
	it("is about one third vs twelve months", () => {
		expect(getPlusAnnualSavingsPercent("PEN")).toBe(33);
		expect(getPlusAnnualSavingsPercent("USD")).toBe(33);
	});
});

describe("plusMonthlyPriceLabel", () => {
	it("defaults unknown codes to PEN", () => {
		expect(plusMonthlyPriceLabel("XYZ")).toBe("S/ 14.90/mes");
	});
});
