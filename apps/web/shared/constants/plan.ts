/**
 * Precios y copy de Quipu Plus por mercado × intervalo.
 * IDs Polar: mensual + anual (multi-currency en el mismo producto).
 */

import type { CurrencyCode } from "./markets";

export const PLAN_LABELS = {
	free: "Plan Quipu",
	premium: "Plan Quipu Plus",
} as const;

export type BillingInterval = "monthly" | "yearly";

export type PlusPriceQuote = {
	currencyCode: CurrencyCode;
	interval: BillingInterval;
	/** Minor units (céntimos). */
	amountCents: number;
	/** Etiqueta lista: "S/ 14.90/mes" */
	priceLabel: string;
	/** Precio corto: "S/ 14.90" */
	priceInline: string;
	/** "facturado mensualmente" / "facturado anualmente" */
	billingCadence: string;
};

const PLUS_PRICES: Record<
	CurrencyCode,
	{ monthlyCents: number; yearlyCents: number; symbol: string }
> = {
	PEN: { monthlyCents: 1490, yearlyCents: 11990, symbol: "S/" },
	EUR: { monthlyCents: 499, yearlyCents: 3999, symbol: "€" },
	USD: { monthlyCents: 499, yearlyCents: 3999, symbol: "$" },
};

function formatMinor(amountCents: number, currencyCode: CurrencyCode): string {
	const { symbol } = PLUS_PRICES[currencyCode];
	const major = (amountCents / 100).toFixed(2);
	if (currencyCode === "EUR") return `€${major}`;
	if (currencyCode === "USD") return `$${major}`;
	return `${symbol} ${major}`;
}

export function resolveCurrencyCode(code: string | undefined): CurrencyCode {
	if (code === "EUR" || code === "USD" || code === "PEN") return code;
	return "PEN";
}

export function getPlusPriceQuote(
	currencyCode: string | undefined,
	interval: BillingInterval,
): PlusPriceQuote {
	const code = resolveCurrencyCode(currencyCode);
	const table = PLUS_PRICES[code];
	const amountCents = interval === "monthly" ? table.monthlyCents : table.yearlyCents;
	const priceInline = formatMinor(amountCents, code);
	const suffix = interval === "monthly" ? "/mes" : "/año";
	return {
		currencyCode: code,
		interval,
		amountCents,
		priceLabel: `${priceInline}${suffix}`,
		priceInline,
		billingCadence: interval === "monthly" ? "facturado mensualmente" : "facturado anualmente",
	};
}

/** Ahorro anual vs 12× mensual (~33% en los tres mercados). */
export function getPlusAnnualSavingsPercent(currencyCode: string | undefined): number {
	const code = resolveCurrencyCode(currencyCode);
	const { monthlyCents, yearlyCents } = PLUS_PRICES[code];
	const fullYear = monthlyCents * 12;
	if (fullYear <= 0) return 0;
	return Math.round(((fullYear - yearlyCents) / fullYear) * 100);
}

/** Precio listado mensual — paywalls / hints (mercado del perfil). */
export function plusMonthlyPriceLabel(currencyCode?: string): string {
	return getPlusPriceQuote(currencyCode, "monthly").priceLabel;
}

export function plusMonthlyPriceInline(currencyCode?: string): string {
	return getPlusPriceQuote(currencyCode, "monthly").priceInline;
}

export function plusUpgradePriceHint(currencyCode?: string): string {
	return `Automatización desde ${plusMonthlyPriceLabel(currencyCode)}`;
}

export function plusPaywallCta(currencyCode?: string): string {
	return `Ver qué incluye · ${plusMonthlyPriceInline(currencyCode)}/mes`;
}

export const PLUS_CHECKOUT_CTA = "Pasar a Quipu Plus";
export const PLUS_UPSELL_LINK = "Quipu Plus";

export const PLUS_BILLING_INTERVAL_LABELS = {
	monthly: "Mensual",
	yearly: "Anual",
} as const;
