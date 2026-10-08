import type { api } from "@quipu/convex-api";
import type { FunctionArgs, FunctionReturnType } from "convex/server";
import { parseAmountToCents } from "@/shared/lib/expenses/amount";
import { formatCentsTrimmed } from "@/shared/lib/money";
import { marketFromCurrencyCode } from "@/shared/lib/onboarding/markets";

export type SavingsOverview = FunctionReturnType<typeof api.savings.getOverview>;

export type EmergencyFundDetail = FunctionReturnType<typeof api.savings.getEmergencyFundDetail>;

export type MoveSurplusContext = FunctionReturnType<typeof api.savings.getMoveSurplusContext>;

export type CreateSavingsGoalArgs = FunctionArgs<typeof api.savings.createSavingsGoal>;

export type MoveSurplusArgs = FunctionArgs<typeof api.savings.moveSurplusToSavings>;

export type GoalFormValues = {
	label: string;
	targetRaw: string;
};

export type GoalField = keyof GoalFormValues;

export type GoalDraftResult =
	| { ok: true; args: CreateSavingsGoalArgs }
	| { ok: false; fields: Partial<Record<GoalField, string>> };

export type FundView = {
	label: string;
	amountLabel: string;
	targetLine: string;
	monthsLine: string;
	cycleLine: string | null;
	percent: number;
};

export type GoalView = {
	id: string;
	name: string;
	amountLine: string;
	percent: number;
	footer: string;
};

export type SurplusBannerView = {
	amountLabel: string;
	args: MoveSurplusArgs;
};

export type AhorroScreenModel = {
	totalLabel: string;
	cycleSubtitle: string;
	fund: FundView | null;
	goals: GoalView[];
	canCreateGoal: boolean;
	surplus: SurplusBannerView | null;
	empty: boolean;
};

const GOAL_LABEL_MAX = 40;

/** Convex no trae aporte automático por meta ni mutación para activarlo. */
export const GOAL_WITHOUT_AUTO_CONTRIBUTION = "SIN APORTE AUTOMÁTICO";

const SURPLUS_SOURCE_ORDER = ["extraordinary", "wants", "needs"] as const;

export function savingsBarPercent(currentCents: number, targetCents: number): number {
	if (!Number.isFinite(currentCents) || !Number.isFinite(targetCents) || targetCents <= 0) {
		return 0;
	}
	const ratio = (currentCents / targetCents) * 100;
	if (!Number.isFinite(ratio)) return 0;
	return Math.min(100, Math.max(0, Math.round(ratio)));
}

export function emptyAhorro(symbol = "S/"): AhorroScreenModel {
	return {
		totalLabel: formatCentsTrimmed(0, symbol),
		cycleSubtitle: "Con calma, se nota.",
		fund: null,
		goals: [],
		canCreateGoal: false,
		surplus: null,
		empty: true,
	};
}

export function presentAhorro(
	overview: SavingsOverview,
	fundDetail: EmergencyFundDetail,
	surplus: MoveSurplusContext,
): AhorroScreenModel {
	if (overview == null) return emptyAhorro();

	const symbol = marketFromCurrencyCode(overview.profile?.currencyCode)?.currencySymbol ?? "S/";
	const totalSavedCents = readCents(overview.totalSavedCents);
	const cycleContributionCents = readCents(overview.cycleContributionCents);
	const fund = toFundView(readFund(fundDetail, overview), symbol);
	const goals = toGoalViews(overview.goals, symbol);
	const canCreateGoal = overview.canCreateGoal === true;

	return {
		totalLabel: formatCentsTrimmed(totalSavedCents, symbol),
		cycleSubtitle: cycleSubtitle(cycleContributionCents, symbol),
		fund,
		goals,
		canCreateGoal,
		surplus: surplusBanner(surplus, symbol),
		empty: fund == null && goals.length === 0,
	};
}

export function ahorroPlanSubtitle(overview: SavingsOverview): string | null {
	if (overview == null) return null;
	const goals = Array.isArray(overview.goals) ? overview.goals.length : 0;
	const meta = goals === 1 ? "1 meta activa" : `${goals} metas activas`;
	if (overview.emergencyFund != null) return `Fondo + ${meta}`;
	if (goals > 0) return meta;
	return null;
}

export function toCreateSavingsGoal(values: GoalFormValues): GoalDraftResult {
	const label = values.label.trim();
	if (!label) {
		return { ok: false, fields: { label: "El nombre de la meta es obligatorio." } };
	}
	if (label.length > GOAL_LABEL_MAX) {
		return {
			ok: false,
			fields: { label: "El nombre de la meta debe tener como máximo 40 caracteres." },
		};
	}

	const targetRaw = values.targetRaw.trim();
	if (!targetRaw) return { ok: true, args: { label } };

	const targetAmount = parseAmountToCents(targetRaw);
	if (targetAmount == null || targetAmount <= 0) {
		return { ok: false, fields: { targetRaw: "La meta debe ser mayor a cero." } };
	}
	return { ok: true, args: { label, targetAmount } };
}

function cycleSubtitle(cents: number, symbol: string): string {
	if (cents > 0) {
		return `Guardas ${formatCentsTrimmed(cents, symbol)} cada ciclo. Con calma, se nota.`;
	}
	return "Con calma, se nota.";
}

function readFund(fundDetail: EmergencyFundDetail, overview: SavingsOverview) {
	if (fundDetail != null && fundDetail.emergencyFund != null) return fundDetail.emergencyFund;
	if (overview != null && overview.emergencyFund != null) return overview.emergencyFund;
	return null;
}

function toFundView(fund: ReturnType<typeof readFund>, symbol: string): FundView | null {
	if (fund == null) return null;
	const currentAmount = readCents(fund.currentAmount);
	const targetAmount = readCents(fund.targetAmount);
	const essentials = readCents(fund.monthlyEssentialsCents);
	const cycleContributionCents = readCents(fund.cycleContributionCents);
	const targetMonths = essentials > 0 ? targetAmount / essentials : null;
	const monthsLine = fundMonthsLine(fund.monthsCovered, fund.monthsCoveredCopy, targetMonths);

	return {
		label: readName(fund.label, "Fondo de emergencia"),
		amountLabel: formatCentsTrimmed(currentAmount, symbol),
		targetLine: fundTargetLine(targetAmount, targetMonths, symbol),
		monthsLine,
		cycleLine:
			cycleContributionCents > 0
				? `+${formatCentsTrimmed(cycleContributionCents, symbol)} / CICLO`
				: null,
		percent: savingsBarPercent(currentAmount, targetAmount),
	};
}

function fundMonthsLine(
	monthsCovered: unknown,
	monthsCoveredCopy: unknown,
	targetMonths: number | null,
): string {
	const covered =
		typeof monthsCovered === "number" && Number.isFinite(monthsCovered) ? monthsCovered : null;
	if (covered != null && targetMonths != null && Number.isFinite(targetMonths)) {
		const coveredLabel = formatMonthCount(covered);
		const targetLabel = formatMonthCount(targetMonths);
		if (coveredLabel && targetLabel) {
			return `${coveredLabel} DE ${targetLabel} MESES CUBIERTOS`;
		}
	}
	if (typeof monthsCoveredCopy === "string" && monthsCoveredCopy.trim()) {
		return monthsCoveredCopy;
	}
	return "";
}

function fundTargetLine(targetAmount: number, targetMonths: number | null, symbol: string): string {
	const money = `de ${formatCentsTrimmed(targetAmount, symbol)}`;
	if (targetMonths == null || !Number.isFinite(targetMonths)) return money;
	const label = formatMonthCount(targetMonths);
	if (!label) return money;
	const noun = label === "1" ? "mes" : "meses";
	return `${money} · meta de ${label} ${noun} de gastos`;
}

function toGoalViews(goals: unknown, symbol: string): GoalView[] {
	if (!Array.isArray(goals)) return [];
	const views: GoalView[] = [];
	for (const goal of goals) {
		if (goal == null || goal.isSystemDefault === true) continue;
		if (typeof goal.id !== "string" || !goal.id) continue;
		const target =
			typeof goal.targetAmount === "number" && goal.targetAmount > 0 ? goal.targetAmount : null;
		const currentAmount = readCents(goal.currentAmount);
		views.push({
			id: goal.id,
			name: readName(goal.label, "Meta"),
			amountLine: goalAmountLine(currentAmount, target, symbol),
			percent: savingsBarPercent(currentAmount, target ?? 0),
			footer: GOAL_WITHOUT_AUTO_CONTRIBUTION,
		});
	}
	return views;
}

function goalAmountLine(currentAmount: number, target: number | null, symbol: string): string {
	const currentLabel = formatCentsTrimmed(currentAmount, symbol);
	if (target == null) return currentLabel;
	return `${currentLabel} de ${formatCentsTrimmed(target, "").trim()}`;
}

function surplusBanner(context: MoveSurplusContext, symbol: string): SurplusBannerView | null {
	if (context == null || context.sources == null) return null;
	for (const fromEnvelope of SURPLUS_SOURCE_ORDER) {
		const availableCents = context.sources[fromEnvelope]?.availableCents;
		if (!Number.isInteger(availableCents) || availableCents <= 0) continue;
		const toSubEnvelopeId = fundDestinationId(context);
		const args: MoveSurplusArgs = toSubEnvelopeId
			? { fromEnvelope, amount: availableCents, toSubEnvelopeId }
			: { fromEnvelope, amount: availableCents };
		return {
			amountLabel: formatCentsTrimmed(availableCents, symbol),
			args,
		};
	}
	return null;
}

function fundDestinationId(context: NonNullable<MoveSurplusContext>) {
	if (!Array.isArray(context.destinations)) return undefined;
	for (const destination of context.destinations) {
		if (destination?.isSystemDefault && destination.id) return destination.id;
	}
	return undefined;
}

function formatMonthCount(value: number): string | null {
	if (!Number.isFinite(value) || value < 0) return null;
	const rounded = Math.round(value * 10) / 10;
	return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

function readCents(value: unknown): number {
	return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function readName(value: unknown, fallback: string): string {
	if (typeof value === "string" && value.trim()) return value.trim();
	return fallback;
}
