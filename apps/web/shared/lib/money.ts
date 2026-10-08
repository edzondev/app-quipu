/**
 * Utilidades de dinero para Quipu.
 *
 * Regla de oro: el backend trabaja en **céntimos enteros** (números).
 * La UI formatea con la moneda del perfil; parsea a céntimos para enviar.
 * Este módulo es la única puerta de entrada — nunca formatees montos a mano
 * en un componente.
 */

import { DEFAULT_CURRENCY, localeForCurrency } from "@/core/constants";

const CENTS_FORMATTER_CACHE = new Map<string, Intl.NumberFormat>();

function getCentsFormatter(options: {
	currency: string;
	locale: string;
	showSymbol: boolean;
	minimumFractionDigits: number;
}): Intl.NumberFormat {
	const key = `${options.locale}:${options.currency}:${options.showSymbol}:${options.minimumFractionDigits}`;
	const cached = CENTS_FORMATTER_CACHE.get(key);
	if (cached) return cached;
	const formatter = new Intl.NumberFormat(options.locale, {
		style: options.showSymbol ? "currency" : "decimal",
		currency: options.currency,
		minimumFractionDigits: options.minimumFractionDigits,
		maximumFractionDigits: 2,
	});
	CENTS_FORMATTER_CACHE.set(key, formatter);
	return formatter;
}

/**
 * Tipo monetario. Siempre céntimos enteros (sin coma flotante).
 */
export type Cents = number;

/**
 * Formatea céntimos a string monetario localizado.
 *
 * @example
 * formatCents(123456, { currency: "PEN" }) // "S/ 1,234.56"
 * formatCents(0, { currency: "EUR" }) // "0,00 €" (locale es-ES)
 */
export function formatCents(
	cents: Cents,
	options?: {
		currency?: string;
		locale?: string;
		showSymbol?: boolean;
		minimumFractionDigits?: number;
	},
): string {
	const currency = options?.currency ?? DEFAULT_CURRENCY.code;
	const {
		locale = localeForCurrency(currency),
		showSymbol = true,
		minimumFractionDigits = 2,
	} = options ?? {};

	const formatter = getCentsFormatter({
		currency,
		locale,
		showSymbol,
		minimumFractionDigits,
	});

	return formatter.format(cents / 100);
}

/**
 * Parsea un input del usuario a céntimos enteros.
 *
 * Acepta formatos:
 *   - "1234"      → 123400
 *   - "1234.56"   → 123456
 *   - "1,234.56"  → 123456
 *   - "1.234,56"  → 123456 (formato europeo)
 *   - "S/ 1234.56" → 123456
 *   - "1234,56"   → 123456 (asumiendo coma decimal en es-PE)
 *
 * Retorna null si el string no es parseable.
 */
export function parseToCents(input: string): Cents | null {
	if (typeof input !== "string") return null;
	const trimmed = input.trim();
	if (!trimmed) return null;

	// Quitar símbolo de moneda y espacios.
	const cleaned = trimmed.replace(/[S$/€£¥₹]/g, "").trim();
	if (!cleaned) return null;

	// Detectar formato: si tiene "," y ".", el último es el decimal.
	// Si solo tiene ",", puede ser decimal (es-PE) o miles (en-US).
	// Asumimos decimal si hay exactamente una coma y ≤ 2 dígitos después.
	const hasComma = cleaned.includes(",");
	const hasDot = cleaned.includes(".");

	let normalized: string;
	if (hasComma && hasDot) {
		const lastComma = cleaned.lastIndexOf(",");
		const lastDot = cleaned.lastIndexOf(".");
		const decimalSep = lastComma > lastDot ? "," : ".";
		const thousandSep = decimalSep === "," ? "." : ",";
		normalized = cleaned.split(thousandSep).join("").replace(decimalSep, ".");
	} else if (hasComma) {
		const parts = cleaned.split(",");
		if (parts.length === 2 && parts[1] !== undefined && parts[1].length <= 2) {
			// Decimal
			normalized = `${parts[0]}.${parts[1]}`;
		} else {
			// Miles
			normalized = parts.join("");
		}
	} else {
		normalized = cleaned;
	}

	const num = Number(normalized);
	if (!Number.isFinite(num) || num < 0) return null;

	return Math.round(num * 100);
}
