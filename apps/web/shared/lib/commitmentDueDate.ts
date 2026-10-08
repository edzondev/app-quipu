const LIMA_TIMEZONE = "America/Lima";
export const MS_PER_DAY = 24 * 60 * 60 * 1000;
const LIMA_DATE_PARTS_FORMATTER = new Intl.DateTimeFormat("en-US", {
	timeZone: LIMA_TIMEZONE,
	day: "numeric",
	month: "numeric",
	year: "numeric",
});

type LimaDateParts = {
	year: number;
	month: number;
	day: number;
};

function getLimaParts(timestamp: number): LimaDateParts {
	const parts = LIMA_DATE_PARTS_FORMATTER.formatToParts(new Date(timestamp));

	return {
		day: Number(parts.find((part) => part.type === "day")?.value ?? 1),
		month: Number(parts.find((part) => part.type === "month")?.value ?? 1),
		year: Number(parts.find((part) => part.type === "year")?.value ?? 1970),
	};
}

function daysInMonth(year: number, month: number): number {
	return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function clampDueDay(dueDay: number, year: number, month: number): number {
	return Math.min(dueDay, daysInMonth(year, month));
}

export function timestampForLimaDate(year: number, month: number, day: number): number {
	const iso = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T00:00:00-05:00`;
	return new Date(iso).getTime();
}

export function limaStartOfDay(timestamp: number): number {
	const parts = getLimaParts(timestamp);
	return timestampForLimaDate(parts.year, parts.month, parts.day);
}

/**
 * First concrete due date for a new commitment.
 * Skips calendar occurrences before the commitment existed.
 */
export function computeInitialNextDueAt(dueDay: number, fromTimestamp: number): number {
	const { year, month, day: today } = getLimaParts(fromTimestamp);

	if (dueDay >= today) {
		const day = clampDueDay(dueDay, year, month);
		return timestampForLimaDate(year, month, day);
	}

	const nextMonth = month === 12 ? 1 : month + 1;
	const nextYear = month === 12 ? year + 1 : year;
	const day = clampDueDay(dueDay, nextYear, nextMonth);
	return timestampForLimaDate(nextYear, nextMonth, day);
}

/** Next monthly occurrence after a concrete due date. */
export function advanceNextDueAt(currentNextDueAt: number, dueDay: number): number {
	const { year, month } = getLimaParts(currentNextDueAt);
	const nextMonth = month === 12 ? 1 : month + 1;
	const nextYear = month === 12 ? year + 1 : year;
	const day = clampDueDay(dueDay, nextYear, nextMonth);
	return timestampForLimaDate(nextYear, nextMonth, day);
}

export function resolveCommitmentNextDueAt(params: {
	dueDay: number;
	nextDueAt?: number;
	createdAt: number;
}): number {
	if (params.nextDueAt != null && Number.isFinite(params.nextDueAt)) {
		return params.nextDueAt;
	}
	return computeInitialNextDueAt(params.dueDay, params.createdAt);
}

export function daysUntilNextDue(nextDueAt: number, now: number): number {
	const dueStart = limaStartOfDay(nextDueAt);
	const todayStart = limaStartOfDay(now);
	return Math.round((dueStart - todayStart) / MS_PER_DAY);
}

export function isPastNextDue(nextDueAt: number, now: number): boolean {
	return limaStartOfDay(now) > limaStartOfDay(nextDueAt);
}

export function computeNextDueAtAfterPayment(params: {
	currentNextDueAt: number;
	dueDay: number;
	now: number;
}): number {
	let next = advanceNextDueAt(params.currentNextDueAt, params.dueDay);
	const todayStart = limaStartOfDay(params.now);

	while (next < todayStart) {
		next = advanceNextDueAt(next, params.dueDay);
	}

	return next;
}
