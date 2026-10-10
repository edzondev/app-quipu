import { ConvexError } from "convex/values";
import { limaDatePartsToTimestamp, limaDayKey } from "../../shared/lib/date";

const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MIN_DAYS_AHEAD = 1;
const MAX_DAYS_AHEAD = 31;

export const NEXT_PAY_DATE_MESSAGE =
	"Tu próxima fecha de cobro debe estar entre mañana y los próximos 31 días.";

/** Medianoche de un día de calendario en America/Lima. */
export function limaMidnightMs(day: string): number {
	if (!DAY_PATTERN.test(day)) return Number.NaN;
	return limaDatePartsToTimestamp({
		year: Number(day.slice(0, 4)),
		month: Number(day.slice(5, 7)),
		day: Number(day.slice(8, 10)),
	});
}

function shiftLimaDay(day: string, days: number): string {
	return limaDayKey(limaMidnightMs(day) + days * MS_PER_DAY);
}

export function assertNextPayDate(nextPayDate: string, now: number): number {
	const midnight = limaMidnightMs(nextPayDate);
	const today = limaDayKey(now);
	const earliest = shiftLimaDay(today, MIN_DAYS_AHEAD);
	const latest = shiftLimaDay(today, MAX_DAYS_AHEAD);
	const valid =
		DAY_PATTERN.test(nextPayDate) &&
		Number.isFinite(midnight) &&
		limaDayKey(midnight) === nextPayDate &&
		nextPayDate >= earliest &&
		nextPayDate <= latest;
	if (!valid) {
		throw new ConvexError({
			code: "VALIDATION_ERROR",
			message: NEXT_PAY_DATE_MESSAGE,
			data: { field: "nextPayDate" },
		});
	}
	return midnight;
}
