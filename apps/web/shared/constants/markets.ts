/**
 * Mercados soportados (ledger + copy Plus).
 * Moneda fija tras onboarding; Polar cobra con multi-currency del producto.
 */

export type CurrencyCode = "PEN" | "EUR" | "USD";

export type SupportedMarket = {
	id: "pe" | "es" | "us";
	country: string;
	currencyCode: CurrencyCode;
	currencySymbol: string;
	locale: string;
	/** Etiqueta corta para UI (onboarding / ajustes). */
	label: string;
	/** Nombre de la moneda en preferencias. */
	currencyLabel: string;
};

export const SUPPORTED_MARKETS: readonly SupportedMarket[] = [
	{
		id: "pe",
		country: "Perú",
		currencyCode: "PEN",
		currencySymbol: "S/",
		locale: "es-PE",
		label: "Perú",
		currencyLabel: "Sol peruano",
	},
	{
		id: "es",
		country: "España",
		currencyCode: "EUR",
		currencySymbol: "€",
		locale: "es-ES",
		label: "España",
		currencyLabel: "Euro",
	},
	{
		id: "us",
		country: "Estados Unidos",
		currencyCode: "USD",
		currencySymbol: "$",
		locale: "en-US",
		label: "Estados Unidos",
		currencyLabel: "Dólar estadounidense",
	},
] as const;

export const DEFAULT_MARKET: SupportedMarket = {
	id: "pe",
	country: "Perú",
	currencyCode: "PEN",
	currencySymbol: "S/",
	locale: "es-PE",
	label: "Perú",
	currencyLabel: "Sol peruano",
};

/** @deprecated Prefer DEFAULT_MARKET; se mantiene por call sites existentes. */
export const DEFAULT_CURRENCY = {
	code: DEFAULT_MARKET.currencyCode,
	symbol: DEFAULT_MARKET.currencySymbol,
	label: DEFAULT_MARKET.currencyLabel,
} as const;

export function isSupportedCurrencyCode(code: string): code is CurrencyCode {
	return SUPPORTED_MARKETS.some((m) => m.currencyCode === code);
}

export function marketFromCurrencyCode(code: string): SupportedMarket | undefined {
	return SUPPORTED_MARKETS.find((m) => m.currencyCode === code);
}

export function marketFromId(id: SupportedMarket["id"]): SupportedMarket | undefined {
	return SUPPORTED_MARKETS.find((m) => m.id === id);
}

export function localeForCurrency(code: string): string {
	return marketFromCurrencyCode(code)?.locale ?? DEFAULT_MARKET.locale;
}

export function currencySymbolForCode(code: string): string {
	return marketFromCurrencyCode(code)?.currencySymbol ?? DEFAULT_MARKET.currencySymbol;
}

/** Nombre corto del selector: primera palabra de `currencyLabel` (Sol, Euro, Dólar). */
export function currencySelectorLabel(market: SupportedMarket): string {
	const [name] = market.currencyLabel.split(" ");
	if (name === undefined || name.length === 0) {
		return market.currencyLabel;
	}
	return name;
}

export function currencyReadOnlyLabel(code: string, symbol?: string): string {
	const market = marketFromCurrencyCode(code);
	if (!market) {
		return symbol ? `${code} · ${symbol}` : code;
	}
	return `${market.currencyLabel} · ${market.currencySymbol}`;
}

/**
 * Valida el código de moneda contra el catálogo.
 * createProfile normaliza país/símbolo a valores canónicos.
 */
export function resolveMarketTriplet(input: {
	country: string;
	currencyCode: string;
	currencySymbol: string;
}): SupportedMarket | null {
	return marketFromCurrencyCode(input.currencyCode) ?? null;
}
