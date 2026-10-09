import { marketFromCurrencyCode } from "@/shared/lib/onboarding/markets";

export function currencySymbol(code?: string): string {
	return marketFromCurrencyCode(code ?? "")?.currencySymbol ?? "S/";
}

export function formatCents(cents: number, symbol = "S/"): string {
	const negative = cents < 0;
	const abs = Math.abs(Math.trunc(cents));
	const whole = Math.floor(abs / 100);
	const fraction = abs % 100;
	const grouped = whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
	const body = `${grouped}.${String(fraction).padStart(2, "0")}`;
	return `${negative ? "-" : ""}${symbol} ${body}`;
}

/** Whole soles drop the fraction. Partial soles keep two decimals. */
export function formatCentsTrimmed(cents: number, symbol = "S/"): string {
	const negative = cents < 0;
	const abs = Math.abs(Math.trunc(cents));
	const whole = Math.floor(abs / 100);
	const fraction = abs % 100;
	const grouped = whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
	const body = fraction === 0 ? grouped : `${grouped}.${String(fraction).padStart(2, "0")}`;
	return `${negative ? "-" : ""}${symbol} ${body}`;
}

/** «Te pasaste por S/ X». El monto va en positivo: el signo no se pega al número. */
export function overspentByLabel(cents: number, symbol = "S/"): string {
	return `Te pasaste por ${formatCentsTrimmed(Math.abs(cents), symbol)}`;
}
