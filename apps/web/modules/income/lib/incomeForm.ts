import { getLimaDateParts, isSameLimaDay, limaStartOfDay } from "@/shared/lib/date";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const LIMA_SHORT_MONTH_FORMATTER = new Intl.DateTimeFormat("es-PE", {
	timeZone: "America/Lima",
	month: "short",
});

function formatIncomeDayMonth(occurredAt: number): string {
	const { day } = getLimaDateParts(occurredAt);
	const monthLabel = LIMA_SHORT_MONTH_FORMATTER.format(new Date(occurredAt))
		.replace(/\.$/, "")
		.toLowerCase();
	return `${day} ${monthLabel}`;
}

export function formatIncomeDateLabel(occurredAt: number, now: number = Date.now()): string {
	const dayMonth = formatIncomeDayMonth(occurredAt);

	if (isSameLimaDay(occurredAt, now)) {
		return `Hoy · ${dayMonth}`;
	}

	const yesterday = limaStartOfDay(now) - MS_PER_DAY;
	if (isSameLimaDay(occurredAt, yesterday)) {
		return `Ayer · ${dayMonth}`;
	}

	const { year: eventYear } = getLimaDateParts(occurredAt);
	const { year: currentYear } = getLimaDateParts(now);
	if (eventYear !== currentYear) {
		return `${dayMonth} ${eventYear}`;
	}

	return dayMonth;
}

export function buildIncomeDescription(sourceLabel: string, concept: string): string {
	const trimmedConcept = concept.trim();
	return trimmedConcept || sourceLabel;
}
