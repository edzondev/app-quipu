export type CurrencyCode = "PEN" | "EUR" | "USD";

export type SupportedMarket = {
	id: "pe" | "es" | "us";
	country: string;
	currencyCode: CurrencyCode;
	currencySymbol: string;
	locale: string;
};

export const SUPPORTED_MARKETS: readonly SupportedMarket[] = [
	{
		id: "pe",
		country: "Perú",
		currencyCode: "PEN",
		currencySymbol: "S/",
		locale: "es-PE",
	},
	{
		id: "es",
		country: "España",
		currencyCode: "EUR",
		currencySymbol: "€",
		locale: "es-ES",
	},
	{
		id: "us",
		country: "Estados Unidos",
		currencyCode: "USD",
		currencySymbol: "$",
		locale: "en-US",
	},
];

export const DEFAULT_MARKET: SupportedMarket = SUPPORTED_MARKETS[0];

export function marketFromCurrencyCode(code: string): SupportedMarket | undefined {
	return SUPPORTED_MARKETS.find((m) => m.currencyCode === code);
}

export function marketFromId(id: SupportedMarket["id"]): SupportedMarket | undefined {
	return SUPPORTED_MARKETS.find((m) => m.id === id);
}
