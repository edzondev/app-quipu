import { ConvexError } from "convex/values";

type MinimalCycle = { _id: string; startDate: number; endDate: number };

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
