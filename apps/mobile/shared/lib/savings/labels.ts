import type { api } from "@quipu/convex-api";
import type { FunctionReturnType } from "convex/server";
import { formatCentsTrimmed } from "@/shared/lib/money";
import { ahorroPlanRow, type SavingsOverview } from "@/shared/lib/savings/model";

type DashboardSummary = NonNullable<FunctionReturnType<typeof api.dashboard.getSummary>>;

export const SAVINGS_PLANNED_LABEL = "Ahorro planeado";
export const SAVINGS_SAVED_LABEL = "Ahorro ya guardado";

export type SavingsAmountRow = {
	label: string;
	amountLabel: string;
};

/** Ciclo planeado: el snapshot de getSummary, igual que Plan (#155). */
export function plannedSavingsAmountLabel(
	summary: DashboardSummary,
	symbol: string,
): string | null {
	if (summary.cycle == null) return null;
	return formatCentsTrimmed(summary.liquidity.savingsParkedInEnvelopeCents, symbol);
}

export function presentPlannedSavings(
	summary: DashboardSummary,
	symbol: string,
): SavingsAmountRow | null {
	const amountLabel = plannedSavingsAmountLabel(summary, symbol);
	if (amountLabel == null) return null;
	return { label: SAVINGS_PLANNED_LABEL, amountLabel };
}

/** Ya guardado: savings.getOverview.totalSavedCents vía ahorroPlanRow (#155). */
export function presentSavedSavings(
	overview: SavingsOverview | undefined,
): SavingsAmountRow | null {
	if (overview == null) return null;
	const amountLabel = ahorroPlanRow(overview)?.totalLabel;
	if (amountLabel == null) return null;
	return { label: SAVINGS_SAVED_LABEL, amountLabel };
}
