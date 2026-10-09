import { ConvexError } from "convex/values";
import { limaDayKey } from "../../shared/lib/date";

const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MIN_DAYS_AHEAD = 1;
const MAX_DAYS_AHEAD = 31;

export const NEXT_PAY_DATE_MESSAGE =
	"Tu próxima fecha de cobro debe estar entre mañana y los próximos 31 días.";

/** Medianoche de un día de calendario en America/Lima (UTC-5, sin DST). */
export function limaMidnightMs(day: string): number {
	return new Date(`${day}T00:00:00-05:00`).getTime();
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
