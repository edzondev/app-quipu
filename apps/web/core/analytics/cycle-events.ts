import { AnalyticsEvents } from "./events";
import { track } from "./track";

/**
 * Emite `financial_cycle_closed` + `financial_cycle_started` cuando un ingreso
 * abre un ciclo nuevo y había un ciclo activo previo.
 */
export function trackFinancialCycleTransition(
	activeCycleId: string | undefined,
	response: { cycleId: string; isNewCycle: boolean },
): void {
	if (response.isNewCycle && activeCycleId && activeCycleId !== response.cycleId) {
		track(AnalyticsEvents.FINANCIAL_CYCLE_CLOSED, {
			cycle_id: activeCycleId,
		});
	}
	if (response.isNewCycle) {
		track(AnalyticsEvents.FINANCIAL_CYCLE_STARTED, {
			cycle_id: response.cycleId,
		});
	}
}
