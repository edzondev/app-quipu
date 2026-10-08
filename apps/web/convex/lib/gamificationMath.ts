import { type Infer, v } from "convex/values";
import { limaDateToInputValue, limaStartOfDay } from "../../shared/lib/date";
import { buildCycleLabel } from "./cycleCloseReport";

export const REWARD_THRESHOLDS = {
	tintaTheme: 3,
	clayAccent: 6,
	annualReport: 12,
} as const;

export type CycleComplianceStatus = "compliant" | "warning" | "failed";

export type AchievementId =
	| "first_cycle_closed"
	| "emergency_fund_25"
	| "three_cycles_wants_discipline"
	| "six_times_all_covered"
	| "emergency_fund_complete"
	| "one_year_in_order";

export type AchievementPresentationState = "done" | "locked";

export type CycleHistoryFact = {
	status: CycleComplianceStatus;
	wantsWithinBudget: boolean;
	allCommitmentsCovered: boolean;
	evaluatedAt: number;
};

export type AchievementView = {
	id: AchievementId;
	state: AchievementPresentationState;
	earnedAt: number | null;
	lockedHint: string | null;
};

export function computeNextStreak(
	currentStreak: number,
	longestStreak: number,
	cycleStatus: CycleComplianceStatus,
): { currentStreak: number; longestStreak: number } {
	if (cycleStatus === "failed") {
		return { currentStreak: 0, longestStreak };
	}
	const next = currentStreak + 1;
	return { currentStreak: next, longestStreak: Math.max(longestStreak, next) };
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const CURRENT_CYCLE_BAR_HEIGHT_PX = 26;

export const progressChartBarValidator = v.object({
	id: v.number(),
	status: v.union(
		v.literal("compliant"),
		v.literal("warning"),
		v.literal("failed"),
		v.literal("empty"),
		v.literal("current"),
	),
	heightPx: v.number(),
	cycleStart: v.union(v.number(), v.null()),
	monthLabel: v.union(v.string(), v.null()),
});

type ProgressChartBar = Infer<typeof progressChartBarValidator>;

export function endOfLimaDayInclusive(now: number): number {
	return limaStartOfDay(now) + MS_PER_DAY - 1;
}

/**
 * Días seguidos con al menos un gasto, en America/Lima.
 * Si hoy ya tiene un gasto, la racha termina hoy. Si no, termina ayer.
 * Hoy vacío y ayer vacío vale 0. No es `streaks.currentStreak` (eso cuenta ciclos cerrados).
 */
export function countDaysWithoutSkipping(
	expenseTimestamps: readonly number[],
	now: number,
): number {
	const days = new Set(expenseTimestamps.map((timestamp) => limaDateToInputValue(timestamp)));
	const todayStart = limaStartOfDay(now);
	const yesterdayStart = todayStart - MS_PER_DAY;
	const todayKey = limaDateToInputValue(todayStart);
	const yesterdayKey = limaDateToInputValue(yesterdayStart);
	const anchor = days.has(todayKey) ? todayStart : days.has(yesterdayKey) ? yesterdayStart : null;
	if (anchor === null) return 0;

	let count = 0;
	let cursor = anchor;
	while (days.has(limaDateToInputValue(cursor))) {
		count += 1;
		const previous = limaStartOfDay(cursor) - MS_PER_DAY;
		if (previous >= cursor) break;
		cursor = previous;
	}
	return count;
}

export function buildCycleChartBars(
	history: ReadonlyArray<{
		status: "compliant" | "warning" | "failed";
		evaluatedAt: number;
		cycleStart: number | null;
	}>,
	currentCycle: { cycleStart: number } | null = null,
	limit = 12,
): ProgressChartBar[] {
	const sorted = [...history].sort((a, b) => a.evaluatedAt - b.evaluatedAt);
	const recent = sorted.slice(-limit);
	const bars: ProgressChartBar[] = recent.map((entry, index) => {
		const base = entry.status === "compliant" ? 26 : entry.status === "warning" ? 22 : 18;
		const wobble = (index % 3) * 4;
		return {
			id: entry.evaluatedAt,
			status: entry.status,
			heightPx: base + wobble,
			cycleStart: entry.cycleStart,
			monthLabel: entry.cycleStart === null ? null : buildCycleLabel(entry.cycleStart),
		};
	});
	let emptySlot = 0;
	while (bars.length < limit) {
		bars.unshift({
			id: -(emptySlot + 1),
			status: "empty",
			heightPx: 0,
			cycleStart: null,
			monthLabel: null,
		});
		emptySlot += 1;
	}
	if (currentCycle !== null) {
		bars.push({
			id: currentCycle.cycleStart,
			status: "current",
			heightPx: CURRENT_CYCLE_BAR_HEIGHT_PX,
			cycleStart: currentCycle.cycleStart,
			monthLabel: buildCycleLabel(currentCycle.cycleStart),
		});
	}
	return bars;
}

export function countConsecutiveWantsDiscipline(
	history: ReadonlyArray<Pick<CycleHistoryFact, "wantsWithinBudget" | "evaluatedAt">>,
): number {
	const sorted = [...history].sort((a, b) => b.evaluatedAt - a.evaluatedAt);
	let count = 0;
	for (const entry of sorted) {
		if (!entry.wantsWithinBudget) break;
		count += 1;
	}
	return count;
}

export function countAllCoveredCycles(
	history: ReadonlyArray<Pick<CycleHistoryFact, "allCommitmentsCovered">>,
): number {
	return history.filter((entry) => entry.allCommitmentsCovered).length;
}

export function isRewardUnlocked(
	rewardId: keyof typeof REWARD_THRESHOLDS,
	currentStreak: number,
): boolean {
	return currentStreak >= REWARD_THRESHOLDS[rewardId];
}

export function canUseAccentPreset(
	preset: "moss" | "steel" | "clay",
	currentStreak: number,
): boolean {
	if (preset === "clay") {
		return currentStreak >= REWARD_THRESHOLDS.clayAccent;
	}
	return true;
}

export function canUseTheme(theme: "light" | "tinta", currentStreak: number): boolean {
	if (theme === "tinta") {
		return currentStreak >= REWARD_THRESHOLDS.tintaTheme;
	}
	return true;
}

export function buildAchievements(input: {
	history: ReadonlyArray<CycleHistoryFact>;
	emergencyFundProgressPercent: number;
	emergencyFundTargetCents: number;
	emergencyFundCurrentCents: number;
	currentStreak: number;
	formatRemaining: (cents: number) => string;
}): AchievementView[] {
	const closedCycles = input.history.length;
	const wantsDiscipline = countConsecutiveWantsDiscipline(input.history);
	const allCoveredCount = countAllCoveredCycles(input.history);
	const sortedAsc = [...input.history].sort((a, b) => a.evaluatedAt - b.evaluatedAt);

	const firstClosedAt = sortedAsc[0]?.evaluatedAt ?? null;

	const target25Cents = Math.ceil(input.emergencyFundTargetCents * 0.25);
	const remainingTo25 = Math.max(0, target25Cents - input.emergencyFundCurrentCents);

	const wantsThreeAt =
		wantsDiscipline >= 3
			? ([...input.history]
					.sort((a, b) => b.evaluatedAt - a.evaluatedAt)
					.slice(0, 3)
					.at(-1)?.evaluatedAt ?? null)
			: null;

	const sixCoveredAt =
		allCoveredCount >= 6
			? ([...input.history]
					.filter((h) => h.allCommitmentsCovered)
					.sort((a, b) => a.evaluatedAt - b.evaluatedAt)[5]?.evaluatedAt ?? null)
			: null;

	const fundCompleteAt =
		input.emergencyFundProgressPercent >= 100 ? (sortedAsc.at(-1)?.evaluatedAt ?? null) : null;

	const oneYearAt =
		input.currentStreak >= 12
			? ([...input.history].sort((a, b) => b.evaluatedAt - a.evaluatedAt)[11]?.evaluatedAt ?? null)
			: null;

	const fund25Done = input.emergencyFundProgressPercent >= 25;

	return [
		{
			id: "first_cycle_closed",
			state: closedCycles >= 1 ? "done" : "locked",
			earnedAt: firstClosedAt,
			lockedHint: closedCycles >= 1 ? null : "Cierra tu primer ciclo",
		},
		{
			id: "emergency_fund_25",
			state: fund25Done ? "done" : "locked",
			earnedAt: fund25Done ? (sortedAsc.at(-1)?.evaluatedAt ?? null) : null,
			lockedHint: fund25Done
				? null
				: `Te falta ${input.formatRemaining(remainingTo25)} para el 25%`,
		},
		{
			id: "three_cycles_wants_discipline",
			state: wantsDiscipline >= 3 ? "done" : "locked",
			earnedAt: wantsThreeAt,
			lockedHint:
				wantsDiscipline >= 3
					? null
					: `${Math.max(0, 3 - wantsDiscipline)} ciclos más sin pasarte de Gustos`,
		},
		{
			id: "six_times_all_covered",
			state: allCoveredCount >= 6 ? "done" : "locked",
			earnedAt: sixCoveredAt,
			lockedHint:
				allCoveredCount >= 6
					? null
					: `${Math.max(0, 6 - allCoveredCount)} ciclos más con todo cubierto`,
		},
		{
			id: "emergency_fund_complete",
			state: input.emergencyFundProgressPercent >= 100 ? "done" : "locked",
			earnedAt: fundCompleteAt,
			lockedHint:
				input.emergencyFundProgressPercent >= 100
					? null
					: `Te falta ${input.formatRemaining(
							Math.max(0, input.emergencyFundTargetCents - input.emergencyFundCurrentCents),
						)}`,
		},
		{
			id: "one_year_in_order",
			state: input.currentStreak >= 12 ? "done" : "locked",
			earnedAt: oneYearAt,
			lockedHint:
				input.currentStreak >= 12
					? null
					: `${Math.max(0, 12 - input.currentStreak)} ciclos más en orden`,
		},
	];
}
