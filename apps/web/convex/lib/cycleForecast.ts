import { getLimaDay, limaStartOfDay } from "../../shared/lib/date";
import { MS_PER_DAY } from "./dashboardMath";

export type EnvelopeType = "needs" | "wants" | "savings";

export type EnvelopeForecastInput = {
	type: EnvelopeType;
	remainingAmount: number;
	spentAmount: number;
};

export type EnvelopeForecast = {
	type: EnvelopeType;
	label: string;
	burnRateCentsPerDay: number | null;
	daysUntilDepleted: number | null;
	closeProjectionCents: number | null;
	depletedCalendarDay: number | null;
};

export type CycleForecastInput = {
	cycleDay: number;
	daysRemaining: number;
	now: number;
	envelopes: EnvelopeForecastInput[];
};

export type CycleForecast = {
	envelopes: EnvelopeForecast[];
	earliestDepletion: {
		envelopeType: EnvelopeType;
		envelopeLabel: string;
		calendarDay: number | null;
		daysUntilDepleted: number | null;
	} | null;
};

export const MIN_CYCLE_DAYS_FOR_FORECAST = 3;

const ENVELOPE_LABELS: Record<EnvelopeType, string> = {
	needs: "Necesidades",
	wants: "Gustos",
	savings: "Ahorro",
};

export function envelopeLabel(type: EnvelopeType): string {
	return ENVELOPE_LABELS[type];
}

export function computeEnvelopeBurnRate(spentAmount: number, cycleDay: number): number | null {
	if (cycleDay < MIN_CYCLE_DAYS_FOR_FORECAST) return null;
	if (spentAmount <= 0) return null;
	return spentAmount / cycleDay;
}

export function computeDaysUntilDepleted(
	remainingAmount: number,
	burnRateCentsPerDay: number | null,
): number | null {
	if (remainingAmount <= 0) return 0;
	if (burnRateCentsPerDay === null || burnRateCentsPerDay === 0) return null;
	return Math.ceil(remainingAmount / burnRateCentsPerDay);
}

export function computeCloseProjectionCents(
	remainingAmount: number,
	burnRateCentsPerDay: number | null,
	daysRemaining: number,
): number | null {
	if (burnRateCentsPerDay === null) return null;
	return remainingAmount - Math.round(burnRateCentsPerDay * daysRemaining);
}

export function calendarDayAfterDays(now: number, days: number): number {
	return getLimaDay(now + days * MS_PER_DAY);
}

export function buildEnvelopeForecast(
	input: EnvelopeForecastInput,
	cycleDay: number,
	daysRemaining: number,
	now: number,
): EnvelopeForecast {
	const burnRateCentsPerDay = computeEnvelopeBurnRate(input.spentAmount, cycleDay);
	const daysUntilDepleted = computeDaysUntilDepleted(input.remainingAmount, burnRateCentsPerDay);
	const closeProjectionCents = computeCloseProjectionCents(
		input.remainingAmount,
		burnRateCentsPerDay,
		daysRemaining,
	);
	const depletedCalendarDay =
		daysUntilDepleted === null
			? null
			: calendarDayAfterDays(limaStartOfDay(now), daysUntilDepleted);

	return {
		type: input.type,
		label: envelopeLabel(input.type),
		burnRateCentsPerDay,
		daysUntilDepleted,
		closeProjectionCents,
		depletedCalendarDay,
	};
}

export function buildCycleForecast(input: CycleForecastInput): CycleForecast | null {
	if (input.cycleDay < MIN_CYCLE_DAYS_FOR_FORECAST) {
		return null;
	}

	const envelopes = input.envelopes.map((envelope) =>
		buildEnvelopeForecast(envelope, input.cycleDay, input.daysRemaining, input.now),
	);

	const depletionCandidates = envelopes.filter(
		(envelope) => envelope.daysUntilDepleted !== null && envelope.type !== "savings",
	);

	const earliestDepletion =
		depletionCandidates.length === 0
			? null
			: depletionCandidates.reduce((earliest, current) => {
					if (earliest.daysUntilDepleted === null) return current;
					if (current.daysUntilDepleted === null) return earliest;
					if (current.daysUntilDepleted < earliest.daysUntilDepleted) {
						return current;
					}
					return earliest;
				});

	return {
		envelopes,
		earliestDepletion: earliestDepletion
			? {
					envelopeType: earliestDepletion.type,
					envelopeLabel: earliestDepletion.label,
					calendarDay: earliestDepletion.depletedCalendarDay,
					daysUntilDepleted: earliestDepletion.daysUntilDepleted,
				}
			: null,
	};
}
