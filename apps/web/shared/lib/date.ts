/**
 * Utilidades de fecha para Quipu.
 *
 * Toda la app opera en timezone `America/Lima`. Este módulo centraliza los
 * helpers para evitar repetir `Intl.DateTimeFormat` por todos lados.
 */

import { LIMA_TIMEZONE } from "../constants/timezone";

const LIMA_DAY_FORMATTER = new Intl.DateTimeFormat("en-US", {
	timeZone: LIMA_TIMEZONE,
	day: "numeric",
});
const LIMA_MONTH_FORMATTER = new Intl.DateTimeFormat("en-US", {
	timeZone: LIMA_TIMEZONE,
	month: "numeric",
});
const LIMA_YEAR_FORMATTER = new Intl.DateTimeFormat("en-US", {
	timeZone: LIMA_TIMEZONE,
	year: "numeric",
});
const LIMA_DATE_FORMATTER_CACHE = new Map<string, Intl.DateTimeFormat>();
const LIMA_DATE_TIME_FORMATTER_CACHE = new Map<string, Intl.DateTimeFormat>();

function getLimaDateFormatter(locale: string): Intl.DateTimeFormat {
	const cached = LIMA_DATE_FORMATTER_CACHE.get(locale);
	if (cached) return cached;
	const formatter = new Intl.DateTimeFormat(locale, {
		timeZone: LIMA_TIMEZONE,
		day: "numeric",
		month: "short",
		year: "numeric",
	});
	LIMA_DATE_FORMATTER_CACHE.set(locale, formatter);
	return formatter;
}

function getLimaDateTimeFormatter(locale: string): Intl.DateTimeFormat {
	const cached = LIMA_DATE_TIME_FORMATTER_CACHE.get(locale);
	if (cached) return cached;
	const formatter = new Intl.DateTimeFormat(locale, {
		timeZone: LIMA_TIMEZONE,
		day: "numeric",
		month: "short",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
	LIMA_DATE_TIME_FORMATTER_CACHE.set(locale, formatter);
	return formatter;
}

/**
 * Día del mes en timezone Lima (1-31).
 */
export function getLimaDay(timestamp: number = Date.now()): number {
	return Number(LIMA_DAY_FORMATTER.format(new Date(timestamp)));
}

/**
 * Mes en timezone Lima (1-12).
 */
export function getLimaMonth(timestamp: number = Date.now()): number {
	return Number(LIMA_MONTH_FORMATTER.format(new Date(timestamp)));
}

/**
 * Año en timezone Lima.
 */
export function getLimaYear(timestamp: number = Date.now()): number {
	return Number(LIMA_YEAR_FORMATTER.format(new Date(timestamp)));
}

/**
 * Formatea una fecha en formato corto localizado.
 *
 * @example
 * formatLimaDate(1700000000000) // "14 nov 2024"
 */
export function formatLimaDate(timestamp: number, locale = "es-PE"): string {
	return getLimaDateFormatter(locale).format(new Date(timestamp));
}

/**
 * Formatea una fecha con hora.
 *
 * @example
 * formatLimaDateTime(1700000000000) // "14 nov 2024, 15:30"
 */
export function formatLimaDateTime(timestamp: number, locale = "es-PE"): string {
	return getLimaDateTimeFormatter(locale).format(new Date(timestamp));
}

export type LimaDateParts = {
	year: number;
	month: number;
	day: number;
};

/**
 * Partes de calendario (año/mes/día) en timezone Lima.
 */
export function getLimaDateParts(timestamp: number): LimaDateParts {
	return {
		year: getLimaYear(timestamp),
		month: getLimaMonth(timestamp),
		day: getLimaDay(timestamp),
	};
}

/**
 * Construye un timestamp para una fecha específica en Lima, al inicio del día.
 */
export function limaDatePartsToTimestamp(parts: LimaDateParts): number {
	return timestampForLimaDate(parts.year, parts.month, parts.day);
}

function timestampForLimaDate(year: number, month: number, day: number): number {
	const iso = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T00:00:00-05:00`;
	return new Date(iso).getTime();
}

/**
 * Inicio del día de Lima para un instante dado (p. ej. "hoy" en Lima).
 */
export function limaStartOfDay(timestamp: number = Date.now()): number {
	return limaDatePartsToTimestamp(getLimaDateParts(timestamp));
}

export function isSameLimaDay(a: number, b: number): boolean {
	const partsA = getLimaDateParts(a);
	const partsB = getLimaDateParts(b);
	return partsA.year === partsB.year && partsA.month === partsB.month && partsA.day === partsB.day;
}

/** Valor para `<input type="date">` en Lima (YYYY-MM-DD). */
export function limaDateToInputValue(timestamp: number): string {
	const { year, month, day } = getLimaDateParts(timestamp);
	return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Límite inferior razonable para fechas retroactivas de ingreso (1 año). */
export function limaIncomeDateMinTimestamp(now: number = Date.now()): number {
	return limaStartOfDay(now) - 365 * MS_PER_DAY;
}

/**
 * Indica si un día dado de Lima es el primero o segundo día de pago del mes.
 * Devuelve `null` si no es un día de pago.
 */
export function isPayday(
	paydays: number[],
	now: number = Date.now(),
): { isPayday: true; isFirst: boolean } | { isPayday: false } {
	const today = getLimaDay(now);
	const sorted = [...paydays].sort((a, b) => a - b);
	const idx = sorted.indexOf(today);
	if (idx === -1) return { isPayday: false };
	return { isPayday: true, isFirst: idx === 0 };
}
