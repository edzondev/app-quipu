import { ConvexError } from "convex/values";
import type { Doc } from "../_generated/dataModel";

type MinimalCycle = { _id: string; startDate: number; endDate: number };

/** Edit already rejects `occurredAt > now`. Create uses the same rule. */
export const FUTURE_INCOME_DATE_MESSAGE = "La fecha del ingreso no puede ser futura.";

export const NO_ACTIVE_CYCLE_MESSAGE = "Registra primero tu sueldo para empezar un ciclo nuevo.";

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

/** A date never rejects or reroutes an extraordinary income. */
export function rejectIncomeDateForKind(
	incomeKind: Doc<"incomeEvents">["incomeKind"],
	occurredAt: number,
	now: number,
): void {
	if (incomeKind === "extraordinary") return;
	rejectFutureIncomeDate(occurredAt, now);
}

/**
 * Kind decides. An expired cycle stays active until a habitual income closes
 * it. Extraordinary income always stays on that active cycle. NO_ACTIVE_CYCLE
 * is only when the profile has no active cycle at all.
 */
export function resolveCycleForIncome(input: {
	activeCycle: (MinimalCycle & { isOpeningCycle?: boolean }) | null;
	occurredAt: number;
	now: number;
	incomeKind: Doc<"incomeEvents">["incomeKind"];
}): string | null {
	if (input.incomeKind !== "extraordinary") return null;
	if (input.activeCycle === null) {
		throw new ConvexError({
			code: "NO_ACTIVE_CYCLE",
			message: NO_ACTIVE_CYCLE_MESSAGE,
			data: { field: "incomeKind" },
		});
	}
	return input.activeCycle._id;
}
