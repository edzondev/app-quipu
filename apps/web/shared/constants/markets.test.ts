import { describe, expect, it } from "vitest";
import {
	currencyReadOnlyLabel,
	isSupportedCurrencyCode,
	localeForCurrency,
	marketFromCurrencyCode,
	resolveMarketTriplet,
	SUPPORTED_MARKETS,
} from "./markets";

describe("markets catalog", () => {
	it("names the three currencies Sol, Euro and Dólar", () => {
		expect(SUPPORTED_MARKETS.map((market) => market.shortLabel)).toEqual(["Sol", "Euro", "Dólar"]);
	});

	it("supports PEN EUR USD", () => {
		expect(isSupportedCurrencyCode("PEN")).toBe(true);
		expect(isSupportedCurrencyCode("EUR")).toBe(true);
		expect(isSupportedCurrencyCode("USD")).toBe(true);
		expect(isSupportedCurrencyCode("GBP")).toBe(false);
	});

	it("maps locale per currency", () => {
		expect(localeForCurrency("PEN")).toBe("es-PE");
		expect(localeForCurrency("EUR")).toBe("es-ES");
		expect(localeForCurrency("USD")).toBe("en-US");
	});

	it("builds read-only preference label", () => {
		expect(currencyReadOnlyLabel("EUR")).toBe("Euro · €");
	});

	it("resolves market from currency code", () => {
		expect(marketFromCurrencyCode("USD")?.country).toBe("Estados Unidos");
		expect(
			resolveMarketTriplet({
				country: "x",
				currencyCode: "PEN",
				currencySymbol: "x",
			})?.id,
		).toBe("pe");
	});
});
