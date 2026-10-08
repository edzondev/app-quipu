import { plusMonthlyPriceLabel, plusUpgradePriceHint } from "../../shared/constants/plan";
import type { Doc } from "../_generated/dataModel";
import { CYCLE_DAYS, type PayFrequency } from "./budgetMath";

export type IncomeModel = Doc<"profiles">["incomeModel"];
export type PlanTier = Doc<"profiles">["plan"];

const INCOME_MODEL_LABELS: Record<IncomeModel, string> = {
	fixed: "Dependiente",
	variable: "Independiente",
	mixed: "Mixto",
};

const PAY_FREQUENCY_LABELS: Record<PayFrequency, string> = {
	monthly: "Mensual",
	biweekly: "Quincenal",
	weekly: "Semanal",
	variable: "Variable",
};

export const DEFAULT_DAILY_SUMMARY_ENABLED = true;
export const DEFAULT_CYCLE_ALERTS_ENABLED = true;

export function incomeModelLabel(model: IncomeModel): string {
	return INCOME_MODEL_LABELS[model];
}

export function payFrequencyLabel(frequency: PayFrequency): string {
	return PAY_FREQUENCY_LABELS[frequency];
}

export function resolveDailySummaryEnabled(
	profile: Pick<Doc<"profiles">, "dailySummaryEnabled">,
): boolean {
	return profile.dailySummaryEnabled ?? DEFAULT_DAILY_SUMMARY_ENABLED;
}

export function resolveCycleAlertsEnabled(
	profile: Pick<Doc<"profiles">, "cycleAlertsEnabled">,
): boolean {
	return profile.cycleAlertsEnabled ?? DEFAULT_CYCLE_ALERTS_ENABLED;
}

export function planDisplay(
	plan: PlanTier,
	currencyCode?: string,
): {
	tier: PlanTier;
	label: string;
	priceCopy: string | null;
	statusCopy: string;
} {
	if (plan === "premium") {
		return {
			tier: "premium",
			label: "Quipu Plus",
			priceCopy: plusMonthlyPriceLabel(currencyCode),
			statusCopy: "Activo",
		};
	}
	return {
		tier: "free",
		label: "Plan Quipu",
		priceCopy: plusUpgradePriceHint(currencyCode),
		statusCopy: "Plan gratuito",
	};
}

function formatPaydayList(paydays: number[]): string {
	const sorted = [...paydays].sort((a, b) => a - b);
	if (sorted.length === 0) return "";
	if (sorted.length === 1) return `día ${sorted[0]}`;
	const head = sorted
		.slice(0, -1)
		.map((d) => `día ${d}`)
		.join(", ");
	const last = sorted.at(-1);
	if (last === undefined) return "";
	return `${head} y día ${last}`;
}

/** Copy corto del ciclo para ajustes (onboarding / Bloque 9). */
export function buildCycleScheduleCopy(
	profile: Pick<Doc<"profiles">, "incomeModel" | "payFrequency" | "paydays" | "cycleDurationDays">,
): { typeLabel: string; scheduleCopy: string; cycleDays: number | null } {
	if (profile.incomeModel === "variable") {
		const days = profile.cycleDurationDays ?? CYCLE_DAYS.variable;
		return {
			typeLabel: incomeModelLabel("variable"),
			scheduleCopy: `Variable · ${days} días por ciclo`,
			cycleDays: days,
		};
	}

	const frequency = (profile.payFrequency ?? "monthly") as PayFrequency;
	const paydays = profile.paydays ?? [];
	const freqLabel = payFrequencyLabel(frequency);
	const paydayCopy = paydays.length > 0 ? formatPaydayList(paydays) : "sin días configurados";
	const cycleDays = CYCLE_DAYS[frequency] ?? null;

	return {
		typeLabel: incomeModelLabel(profile.incomeModel),
		scheduleCopy: `${freqLabel} · ${paydayCopy}`,
		cycleDays,
	};
}

export function formatActiveCycleRangeCopy(startDate: number, endDate: number): string {
	const opts: Intl.DateTimeFormatOptions = {
		day: "numeric",
		month: "short",
		timeZone: "America/Lima",
	};
	const start = new Date(startDate).toLocaleDateString("es-PE", opts);
	const end = new Date(endDate).toLocaleDateString("es-PE", opts);
	return `Ciclo activo: ${start} – ${end}`;
}
