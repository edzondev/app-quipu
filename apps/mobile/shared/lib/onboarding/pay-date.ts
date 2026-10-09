import { limaStamp } from "@/shared/lib/lima-date";

const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MIN_DAYS_AHEAD = 1;
const MAX_DAYS_AHEAD = 31;

export const NEXT_PAY_DATE_MESSAGE =
	"Tu próxima fecha de cobro debe estar entre mañana y los próximos 31 días.";

const MONTHS = [
	"ene",
	"feb",
	"mar",
	"abr",
	"may",
	"jun",
	"jul",
	"ago",
	"sep",
	"oct",
	"nov",
	"dic",
] as const;

/** Medianoche de un día de calendario en America/Lima. NaN si el día no existe. */
export function limaMidnightMs(day: string): number {
	if (!DAY_PATTERN.test(day)) return Number.NaN;
	const year = Number(day.slice(0, 4));
	const month = Number(day.slice(5, 7));
	const date = Number(day.slice(8, 10));
	const ms = Date.UTC(year, month - 1, date, 5, 0, 0, 0);
	if (limaStamp(ms).key !== day) return Number.NaN;
	return ms;
}

function shiftLimaDay(day: string, days: number): string {
	return limaStamp(limaMidnightMs(day) + days * MS_PER_DAY).key;
}

export function payDateBounds(now: number): { earliest: string; latest: string } {
	const today = limaStamp(now).key;
	return {
		earliest: shiftLimaDay(today, MIN_DAYS_AHEAD),
		latest: shiftLimaDay(today, MAX_DAYS_AHEAD),
	};
}

export function isAllowedPayDate(day: string, now: number): boolean {
	if (!Number.isFinite(limaMidnightMs(day))) return false;
	const { earliest, latest } = payDateBounds(now);
	return day >= earliest && day <= latest;
}

export function formatPayDate(day: string): string {
	const date = Number(day.slice(8, 10));
	const month = MONTHS[Number(day.slice(5, 7)) - 1] ?? "";
	return `${date} ${month} ${day.slice(0, 4)}`;
}

/** Mediodía local: el día que muestra el picker es el `YYYY-MM-DD` que enviamos. */
export function payDateToPickerDate(day: string): Date {
	const year = Number(day.slice(0, 4));
	const month = Number(day.slice(5, 7));
	const date = Number(day.slice(8, 10));
	return new Date(year, month - 1, date, 12, 0, 0, 0);
}

export function pickerDateToPayDate(date: Date): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}
