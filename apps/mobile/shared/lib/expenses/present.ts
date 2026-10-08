import { formatCents } from "@/shared/lib/money";
import { parseAmountToCents } from "./amount";

const LIMA = "America/Lima";

/** daily ya gastado incluye el monto anterior; el preview usa el delta. */
export function remainingAfterExpense(
	dailyCents: number,
	nextAmountCents: number,
	previousAmountCents = 0,
): number {
	return dailyCents - (nextAmountCents - previousAmountCents);
}

export function previewCents(amountRaw: string): number {
	return parseAmountToCents(amountRaw) ?? 0;
}

export function sheetRemainingLabel(remainingCents: number, symbol: string): string {
	return `DESPUÉS DE ESTE GASTO · HOY QUEDA ${formatCents(remainingCents, symbol)}`;
}

export function detailRemainingLabel(remainingCents: number, symbol: string): string {
	return `HOY QUEDARÍA ${formatCents(remainingCents, symbol)}`;
}

export function frequentChipLabel(label: string, amountCents: number): string {
	const safe = Math.max(0, Math.trunc(amountCents));
	const major = Math.floor(safe / 100);
	const minor = safe % 100;
	const amount = minor === 0 ? String(major) : `${major}.${String(minor).padStart(2, "0")}`;
	return `${label} · ${amount}`;
}

export function formatExpenseWhen(timestamp: number, now = Date.now()): string {
	const day = new Intl.DateTimeFormat("es-PE", {
		day: "numeric",
		month: "short",
		timeZone: LIMA,
	})
		.format(new Date(timestamp))
		.replaceAll(".", "")
		.replace(/\s+de\s+/i, " ")
		.toLocaleLowerCase("es-PE")
		.trim();
	if (limaDayKey(timestamp) === limaDayKey(now)) return `Hoy · ${day}`;
	return day;
}

function limaDayKey(ms: number): string {
	return new Intl.DateTimeFormat("en-CA", {
		timeZone: LIMA,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	}).format(new Date(ms));
}
