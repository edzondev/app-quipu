import type { api } from "@quipu/convex-api";
import type { FunctionArgs, FunctionReturnType } from "convex/server";
import { parseAmountToCents } from "@/shared/lib/expenses/amount";
import { formatCentsTrimmed } from "@/shared/lib/money";
import { marketFromCurrencyCode } from "@/shared/lib/onboarding/markets";

export type SavingsOverview = FunctionReturnType<typeof api.savings.getOverview>;

export type MoveSurplusContext = FunctionReturnType<typeof api.savings.getMoveSurplusContext>;

export type CreateSavingsGoalArgs = FunctionArgs<typeof api.savings.createSavingsGoal>;

export type MoveSurplusArgs = FunctionArgs<typeof api.savings.moveSurplusToSavings>;

type Overview = NonNullable<SavingsOverview>;
type Fund = NonNullable<Overview["emergencyFund"]>;
type Goal = Overview["goals"][number];

export type GoalFormValues = {
	label: string;
	targetRaw: string;
};

export type GoalField = keyof GoalFormValues;

export type GoalDraftResult =
	| { ok: true; args: CreateSavingsGoalArgs }
	| { ok: false; fields: Partial<Record<GoalField, string>> };

export type FundView = {
	pending: boolean;
	label: string;
	symbol: string;
	amountBody: string;
	targetLine: string | null;
	monthsLine: string;
	cycleLine: string | null;
	percent: number;
};

export type GoalView = {
	id: string;
	name: string;
	currentLabel: string;
	targetLabel: string | null;
	percent: number | null;
	footer: string;
};

export type SurplusBannerView = {
	amountLabel: string;
	args: MoveSurplusArgs;
};

export type AhorroScreenModel = {
	totalLabel: string;
	totalMuted: boolean;
	cycleSubtitle: string;
	fund: FundView;
	goals: GoalView[];
	canCreateGoal: boolean;
	surplus: SurplusBannerView | null;
};

export type AhorroPlanRow = {
	subtitle: string | null;
	totalLabel: string;
};

const GOAL_LABEL_MAX = 40;
const PENDING_SUBTITLE = "Tu 20% empieza a acumularse con el primer ingreso.";
const PENDING_FUND_COPY =
	"Tu primera meta es cubrir 3 meses de gastos. Quipu la calcula cuando conozca tu ciclo.";

/** Convex no trae aporte automático por meta ni mutación para activarlo. */
export const GOAL_WITHOUT_AUTO_CONTRIBUTION = "SIN APORTE AUTOMÁTICO";

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
		totalMuted: true,
		cycleSubtitle: PENDING_SUBTITLE,
		fund: pendingFund(symbol, "Fondo de emergencia"),
		goals: [],
		canCreateGoal: false,
		surplus: null,
	};
}

export function presentAhorro(
	overview: SavingsOverview,
	surplus: MoveSurplusContext,
): AhorroScreenModel {
	if (overview == null) return emptyAhorro();

	const symbol = marketFromCurrencyCode(overview.profile.currencyCode)?.currencySymbol ?? "S/";
	const cycleContributionCents = overview.cycleContributionCents;

	return {
		totalLabel: formatCentsTrimmed(overview.totalSavedCents, symbol),
		totalMuted: overview.totalSavedCents === 0,
		cycleSubtitle:
			cycleContributionCents > 0
				? `Guardas ${formatCentsTrimmed(cycleContributionCents, symbol)} cada ciclo. Con calma, se nota.`
				: PENDING_SUBTITLE,
		fund: toFundView(overview.emergencyFund, symbol),
		goals: toGoalViews(overview.goals, symbol),
		canCreateGoal: overview.canCreateGoal,
		surplus: surplusBanner(surplus, symbol),
	};
}

export function ahorroPlanRow(overview: SavingsOverview): AhorroPlanRow | null {
	if (overview == null) return null;
	const symbol = marketFromCurrencyCode(overview.profile.currencyCode)?.currencySymbol ?? "S/";
	return {
		subtitle: planSubtitle(overview),
		totalLabel: formatCentsTrimmed(overview.totalSavedCents, symbol),
	};
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

function planSubtitle(overview: Overview): string | null {
	const goals = overview.goals.length;
	const fund = overview.emergencyFund;
	if (fund != null) {
		if (goals === 0) return fund.label;
		if (goals === 1) return "Fondo + 1 meta activa";
		return `Fondo + ${goals} metas activas`;
	}
	if (goals === 1) return "1 meta activa";
	if (goals > 1) return `${goals} metas activas`;
	return null;
}

function toFundView(fund: Fund | null, symbol: string): FundView {
	if (fund == null || fund.targetAmount <= 0) {
		return pendingFund(symbol, fund == null ? "Fondo de emergencia" : fund.label);
	}

	const essentials = fund.monthlyEssentialsCents;
	const targetMonths = essentials > 0 ? fund.targetAmount / essentials : null;

	return {
		pending: false,
		label: fund.label,
		symbol,
		amountBody: solesBody(fund.currentAmount),
		targetLine: fundTargetLine(fund.targetAmount, targetMonths, symbol),
		monthsLine: fundMonthsLine(fund, targetMonths),
		cycleLine:
			fund.cycleContributionCents > 0
				? `+${formatCentsTrimmed(fund.cycleContributionCents, symbol)} / CICLO`
				: null,
		percent: savingsBarPercent(fund.currentAmount, fund.targetAmount),
	};
}

function pendingFund(symbol: string, label: string): FundView {
	return {
		pending: true,
		label,
		symbol,
		amountBody: "0",
		targetLine: PENDING_FUND_COPY,
		monthsLine: "",
		cycleLine: null,
		percent: 0,
	};
}

function fundMonthsLine(fund: Fund, targetMonths: number | null): string {
	if (targetMonths != null && Number.isFinite(targetMonths)) {
		const coveredLabel = formatMonthCount(fund.monthsCovered);
		const targetLabel = formatMonthCount(targetMonths);
		if (coveredLabel && targetLabel) {
			return `${coveredLabel} DE ${targetLabel} MESES CUBIERTOS`;
		}
	}
	return fund.monthsCoveredCopy;
}

function fundTargetLine(targetAmount: number, targetMonths: number | null, symbol: string): string {
	const money = `de ${formatCentsTrimmed(targetAmount, symbol)}`;
	if (targetMonths == null || !Number.isFinite(targetMonths)) return money;
	const label = formatMonthCount(targetMonths);
	if (!label) return money;
	const noun = label === "1" ? "mes" : "meses";
	return `${money} · meta de ${label} ${noun} de gastos`;
}

function toGoalViews(goals: Overview["goals"], symbol: string): GoalView[] {
	const views: GoalView[] = [];
	for (const goal of goals) {
		if (goal.isSystemDefault) continue;
		views.push(toGoalView(goal, symbol));
	}
	return views;
}

function toGoalView(goal: Goal, symbol: string): GoalView {
	const target = goal.targetAmount != null && goal.targetAmount > 0 ? goal.targetAmount : null;
	return {
		id: goal.id,
		name: goal.label,
		currentLabel: formatCentsTrimmed(goal.currentAmount, symbol),
		targetLabel: target == null ? null : `de ${solesBody(target)}`,
		percent: target == null ? null : savingsBarPercent(goal.currentAmount, target),
		footer: GOAL_WITHOUT_AUTO_CONTRIBUTION,
	};
}

function surplusBanner(context: MoveSurplusContext, symbol: string): SurplusBannerView | null {
	if (context == null) return null;
	const availableCents = context.sources.extraordinary.availableCents;
	if (availableCents <= 0) return null;
	const fromEnvelope: MoveSurplusArgs["fromEnvelope"] = "extraordinary";
	const fundId = systemFundId(context.destinations);
	const args: MoveSurplusArgs = fundId
		? { fromEnvelope, amount: availableCents, toSubEnvelopeId: fundId }
		: { fromEnvelope, amount: availableCents };
	return {
		amountLabel: formatCentsTrimmed(availableCents, symbol),
		args,
	};
}

function systemFundId(destinations: NonNullable<MoveSurplusContext>["destinations"]) {
	for (const destination of destinations) {
		if (destination.isSystemDefault) return destination.id;
	}
	return undefined;
}

function formatMonthCount(value: number): string | null {
	if (!Number.isFinite(value) || value < 0) return null;
	const rounded = Math.round(value * 10) / 10;
	return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

function solesBody(cents: number): string {
	return formatCentsTrimmed(cents, "").trim();
}
