import { routeParam } from "./expense-record";

const LIMA_TIME = new Intl.DateTimeFormat("es-PE", {
	hour: "2-digit",
	minute: "2-digit",
	hourCycle: "h23",
	timeZone: "America/Lima",
});

export type DetectedNoticePrefill = {
	id: string;
	amountCents: number | null;
	merchant: string;
	bank: string;
	postedAt: number;
};

export function readDetectedNotice(input: {
	id: unknown;
	cents: unknown;
	merchant: unknown;
	bank: unknown;
	at: unknown;
}): DetectedNoticePrefill | null {
	const id = routeParam(input.id);
	if (id.length === 0) return null;
	return {
		id,
		amountCents: readCents(input.cents),
		merchant: routeParam(input.merchant),
		bank: routeParam(input.bank),
		postedAt: readTime(input.at),
	};
}

export function formatDetectedWhen(timestamp: number): string {
	if (!Number.isFinite(timestamp) || timestamp <= 0) return "";
	return LIMA_TIME.format(new Date(timestamp));
}

function readCents(value: unknown): number | null {
	const raw = routeParam(value);
	if (!/^\d+$/.test(raw)) return null;
	const cents = Number(raw);
	if (!Number.isSafeInteger(cents) || cents <= 0) return null;
	return cents;
}

function readTime(value: unknown): number {
	const raw = routeParam(value);
	if (!/^\d+$/.test(raw)) return 0;
	const time = Number(raw);
	return Number.isSafeInteger(time) ? time : 0;
}
