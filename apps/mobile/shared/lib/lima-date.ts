const LIMA = "America/Lima";

export const LIMA_MONTHS = [
	"ENE",
	"FEB",
	"MAR",
	"ABR",
	"MAY",
	"JUN",
	"JUL",
	"AGO",
	"SEP",
	"OCT",
	"NOV",
	"DIC",
] as const;

export type LimaStamp = {
	key: string;
	day: number;
	monthIndex: number;
	time: string;
};

export function limaStamp(ms: number): LimaStamp {
	const parts = new Intl.DateTimeFormat("en-US", {
		timeZone: LIMA,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		hourCycle: "h23",
	}).formatToParts(new Date(ms));
	const read = (type: Intl.DateTimeFormatPartTypes) =>
		parts.find((part) => part.type === type)?.value ?? "";
	const month = Number(read("month"));
	return {
		key: `${read("year")}-${read("month")}-${read("day")}`,
		day: Number(read("day")),
		monthIndex: Number.isFinite(month) ? month - 1 : 0,
		time: `${read("hour").padStart(2, "0")}:${read("minute").padStart(2, "0")}`,
	};
}

/** Día y mes corto en Lima, p. ej. "16 AGO". */
export function limaDayLabel(ms: number): string {
	const stamp = limaStamp(ms);
	return `${stamp.day} ${LIMA_MONTHS[stamp.monthIndex] ?? ""}`.trim();
}
