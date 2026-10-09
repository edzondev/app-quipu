import { limaDayKey } from "../../shared/lib/date";

export type ExpiredCycleDecision = "close" | "keep";

/**
 * `endDate` is the Lima midnight of the pay date (exclusive).
 * The cycle is expired on that Lima calendar day, not at UTC midnight.
 */
export function isCycleExpiredInLima(endDate: number, now: number): boolean {
	return limaDayKey(now) >= limaDayKey(endDate);
}

/** Close the current cycle only. A later habitual income opens the next one. */
export function shouldCloseExpiredCycle(
	cycle: { status: "active" | "closed"; endDate: number } | null,
	now: number,
): ExpiredCycleDecision {
	if (cycle === null || cycle.status !== "active") return "keep";
	if (!isCycleExpiredInLima(cycle.endDate, now)) return "keep";
	return "close";
}

export function splitExpiredActiveCycle<T extends { status: "active" | "closed"; endDate: number }>(
	cycle: T | null,
	now: number,
): { active: T | null; expired: T | null } {
	if (cycle !== null && shouldCloseExpiredCycle(cycle, now) === "close") {
		return { active: null, expired: cycle };
	}
	return { active: cycle, expired: null };
}
