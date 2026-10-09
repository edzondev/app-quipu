import { ConvexError } from "convex/values";
import { limaDayKey } from "../../shared/lib/date";
import type { Doc } from "../_generated/dataModel";

type MinimalCycle = { _id: string; startDate: number; endDate: number };

/** A Lima calendar day after today. Later today is allowed. */
export const FUTURE_INCOME_DATE_MESSAGE = "La fecha del ingreso no puede ser futura.";

export const INCOME_BEFORE_CYCLE_MESSAGE =
	"La fecha del ingreso no puede ser anterior al inicio del ciclo.";

export const NO_ACTIVE_CYCLE_MESSAGE = "Registra primero tu sueldo para empezar un ciclo nuevo.";

export function futureIncomeDateMessage(occurredAt: number, now: number): string | null {
	if (limaDayKey(occurredAt) > limaDayKey(now)) return FUTURE_INCOME_DATE_MESSAGE;
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

/** Both kinds: a Lima day after today is future. */
export function rejectIncomeDateForKind(
	incomeKind: Doc<"incomeEvents">["incomeKind"],
	occurredAt: number,
	now: number,
): void {
	if (incomeKind === "extraordinary" || incomeKind === "habitual" || incomeKind === undefined) {
		rejectFutureIncomeDate(occurredAt, now);
	}
}

/** Create and edit share this. Any kind, compared by Lima day. */
export function rejectIncomeBeforeCycleStart(occurredAt: number, cycleStartDate: number): void {
	if (limaDayKey(occurredAt) >= limaDayKey(cycleStartDate)) return;
	throw new ConvexError({
		code: "VALIDATION_ERROR",
		message: INCOME_BEFORE_CYCLE_MESSAGE,
		data: { field: "occurredAt" },
	});
}

/** True when `at` falls on the same Lima calendar day as the cycle start. */
export function cycleStartedOnLimaDay(
	cycle: Pick<Doc<"financialCycles">, "startDate">,
	at: number,
): boolean {
	return limaDayKey(cycle.startDate) === limaDayKey(at);
}

/**
 * Kind decides, never source or description. Extraordinary income stays on
 * the active cycle. Habitual income closes it unless that cycle started on
 * the same Lima day as the income. NO_ACTIVE_CYCLE only when none is active.
 */
export function resolveCycleForIncome(input: {
	activeCycle: (MinimalCycle & { isOpeningCycle?: boolean }) | null;
	occurredAt: number;
	now: number;
	incomeKind: Doc<"incomeEvents">["incomeKind"];
}): string | null {
	if (input.activeCycle === null) {
		if (input.incomeKind !== "extraordinary") return null;
		throw new ConvexError({
			code: "NO_ACTIVE_CYCLE",
			message: NO_ACTIVE_CYCLE_MESSAGE,
			data: { field: "incomeKind" },
		});
	}
	if (
		input.incomeKind === "extraordinary" ||
		cycleStartedOnLimaDay(input.activeCycle, input.occurredAt)
	) {
		return input.activeCycle._id;
	}
	return null;
}
