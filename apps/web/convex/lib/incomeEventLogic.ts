import { ConvexError } from "convex/values";
import type { Doc } from "../_generated/dataModel";
import { MS_PER_DAY } from "./dashboardMath";

type MinimalCycle = { _id: string; startDate: number; endDate: number };

/** Habitual pay in the opening cycle may land up to two days before Lima midnight of nextPayDate. */
const OPENING_EARLY_PAY_DAYS = 2;

/** Edit already rejects `occurredAt > now`. Create uses the same rule. */
export const FUTURE_INCOME_DATE_MESSAGE = "La fecha del ingreso no puede ser futura.";

export function futureIncomeDateMessage(occurredAt: number, now: number): string | null {
	if (occurredAt > now) return FUTURE_INCOME_DATE_MESSAGE;
	return null;
}

export function rejectFutureIncomeDate(occurredAt: number, now: number): void {
	const message = futureIncomeDateMessage(occurredAt, now);
	if (message === null) return;
	throw new ConvexError({
		code: "VALIDATION_ERROR",
		message,
		data: { field: "occurredAt" },
	});
}

export function resolveCycleForEvent(input: {
	activeCycle: MinimalCycle | null;
	occurredAt: number;
	now: number;
}): string | null {
	if (!input.activeCycle) return null;
	const { startDate, endDate } = input.activeCycle;
	if (input.occurredAt >= startDate && input.occurredAt < endDate) {
		return input.activeCycle._id;
	}
	return null;
}

/**
 * Same window as `resolveCycleForEvent`, except a habitual income on an opening
 * cycle closes it from two days before `endDate`. Other cycles are unchanged.
 */
export function resolveCycleForIncome(input: {
	activeCycle: (MinimalCycle & { isOpeningCycle?: boolean }) | null;
	occurredAt: number;
	now: number;
	incomeKind: Doc<"incomeEvents">["incomeKind"];
}): string | null {
	const cycle = input.activeCycle;
	if (
		cycle?.isOpeningCycle === true &&
		input.incomeKind === "habitual" &&
		input.occurredAt >= cycle.endDate - OPENING_EARLY_PAY_DAYS * MS_PER_DAY
	) {
		return null;
	}
	return resolveCycleForEvent(input);
}
