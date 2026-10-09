import type { api } from "@quipu/convex-api";
import type { FunctionReturnType } from "convex/server";
import { LIMA_MONTHS, limaMonthName, limaStamp } from "@/shared/lib/lima-date";
import { currencySymbol, formatCentsTrimmed } from "@/shared/lib/money";
import type { SavingsOverview } from "@/shared/lib/savings/model";

export type { SavingsOverview };

export type ProgressOverview = FunctionReturnType<typeof api.progress.getOverview>;
export type ProgressRewards = FunctionReturnType<typeof api.progress.getRewards>;
export type CloseReportResult = FunctionReturnType<typeof api.cycleReport.getLatestCloseReport>;

type Overview = NonNullable<ProgressOverview>;
type ClosePayload = NonNullable<CloseReportResult>;
type ChartBar = Overview["chartBars"][number];
type Achievement = Overview["achievements"][number];
type SpendRow = ClosePayload["report"]["spendByEnvelope"][number];
type SpendType = SpendRow["type"];
type Reward = NonNullable<ProgressRewards>["rewards"][number];

export type BarTone = ChartBar["status"];

export type ProgressBarView = {
	key: string;
	/** «neutral»: ciclo cerrado que no cuenta para la racha ni para «en verde». */
	tone: Exclude<BarTone, "empty"> | "neutral";
	/** Mes corto de Lima. Null si el ciclo no trae cycleStart. */
	monthLabel: string | null;
};

export type AchievementRowView = {
	key: string;
	title: string;
	done: boolean;
	detail: string | null;
};

export type CloseEntryView = {
	label: string;
	highlighted: boolean;
};

export type ProgressScreenModel = {
	empty: boolean;
	streakLabel: string;
	sinceLabel: string | null;
	bars: ProgressBarView[];
	savedLabel: string | null;
	registeredExpenseLabel: string | null;
	daysWithoutSkippingLabel: string | null;
	achievements: AchievementRowView[];
	rewardText: string | null;
	closeEntry: CloseEntryView | null;
};

export type CloseSegmentTone = SpendType | "surplus";

export type CloseSegmentView = {
	tone: CloseSegmentTone;
	percent: number;
	/** Misma etiqueta que la fila del sobre. El sobrante usa «Sobró». */
	label: string;
};

export type CloseRowView = {
	label: string;
	amountLabel: string;
};

export type CloseScreenModel = {
	eyebrow: string;
	title: string;
	subtitle: string;
	spentLabel: string;
	surplusLabel: string | null;
	segments: CloseSegmentView[];
	rows: CloseRowView[];
};

export function presentProgress(
	overview: ProgressOverview,
	rewards: ProgressRewards,
	savings: SavingsOverview,
	closeReport: CloseReportResult,
): ProgressScreenModel {
	const bars = overview == null ? [] : toBars(overview.chartBars);
	const streak = overview == null ? 0 : overview.currentStreak;
	const closeEntry = toCloseEntry(closeReport);
	const empty = closeEntry == null && streak === 0 && bars.every((bar) => bar.tone === "current");

	return {
		empty,
		streakLabel: String(streak),
		sinceLabel: empty || overview == null ? null : sinceLabelFromBars(overview.chartBars),
		bars,
		savedLabel: savedLabel(savings),
		registeredExpenseLabel: overview == null ? null : countLabel(overview.registeredExpenseCount),
		daysWithoutSkippingLabel: overview == null ? null : countLabel(overview.daysWithoutSkipping),
		achievements: overview == null ? [] : toAchievements(overview.achievements),
		rewardText: nextRewardText(rewards),
		closeEntry,
	};
}

export function presentClose(
	closeReport: CloseReportResult,
	savings: SavingsOverview,
): CloseScreenModel | null {
	if (closeReport == null) return null;
	const symbol = currencySymbol(savings?.profile.currencyCode);
	const report = closeReport.report;
	const spentCents = spentTotal(report.spendByEnvelope);
	const leftoverCents = report.totalIncomeCents - spentCents;
	const surplusCents = leftoverCents > 0 ? leftoverCents : null;
	const month = report.cycleLabel.toLocaleLowerCase("es-PE");

	return {
		eyebrow: `CICLO CERRADO · ${report.cycleLabel.toLocaleUpperCase("es-PE")}`,
		title:
			surplusCents == null
				? `Cerraste ${month}.`
				: `Cerraste ${month} con ${formatCentsTrimmed(surplusCents, symbol)} de sobra.`,
		subtitle: streakSubtitle(report.streak),
		spentLabel: `GASTADO ${formatCentsTrimmed(spentCents, symbol)}`,
		surplusLabel: surplusCents == null ? null : `SOBRÓ ${formatCentsTrimmed(surplusCents, symbol)}`,
		segments: toSegments(report, spentCents, surplusCents),
		rows: toRows(report.spendByEnvelope, symbol),
	};
}

function toBars(chartBars: Overview["chartBars"]): ProgressBarView[] {
	return chartBars.flatMap((bar: ChartBar) =>
		bar.status === "empty"
			? []
			: [
					{
						key: String(bar.id),
						tone: bar.status === "current" || bar.countsForStreak ? bar.status : "neutral",
						monthLabel: barMonthLabel(bar.cycleStart),
					},
				],
	);
}

function barMonthLabel(cycleStart: ChartBar["cycleStart"]): string | null {
	if (cycleStart === null) return null;
	return LIMA_MONTHS[limaStamp(cycleStart).monthIndex] ?? null;
}

function sinceLabelFromBars(chartBars: Overview["chartBars"]): string | null {
	for (const bar of chartBars) {
		if (bar.cycleStart === null) continue;
		return `DESDE ${limaMonthName(bar.cycleStart)}`;
	}
	return null;
}

function countLabel(
	value: Overview["registeredExpenseCount"] | Overview["daysWithoutSkipping"],
): string {
	return String(value);
}

function savedLabel(savings: SavingsOverview): string | null {
	if (savings == null) return null;
	return formatCentsTrimmed(savings.totalSavedCents, currencySymbol(savings.profile.currencyCode));
}

function toAchievements(achievements: Overview["achievements"]): AchievementRowView[] {
	return achievements.map((achievement: Achievement) => ({
		key: achievement.id,
		title: achievement.title,
		done: achievement.state === "done",
		detail: achievementDetail(achievement),
	}));
}

function achievementDetail(achievement: Overview["achievements"][number]): string | null {
	if (achievement.state === "done" && achievement.earnedAt != null) {
		return limaMonthName(achievement.earnedAt);
	}
	if (achievement.state === "locked" && achievement.lockedHint) return achievement.lockedHint;
	return null;
}

function nextRewardText(rewards: ProgressRewards): string | null {
	if (rewards == null) return null;
	const reward = rewards.rewards.find((item: Reward) => !item.unlocked);
	if (!reward) return null;
	return `${reward.title} a los ${reward.requiredStreak} ciclos`;
}

function toCloseEntry(closeReport: CloseReportResult): CloseEntryView | null {
	if (closeReport == null) return null;
	return {
		label: `CICLO CERRADO · ${closeReport.report.cycleLabel.toLocaleUpperCase("es-PE")}`,
		highlighted: closeReport.justClosed,
	};
}

function toRows(rows: ClosePayload["report"]["spendByEnvelope"], symbol: string): CloseRowView[] {
	return rows.map((row: SpendRow) => ({
		label: row.label,
		amountLabel: formatCentsTrimmed(row.spentCents, symbol),
	}));
}

function spentTotal(rows: ClosePayload["report"]["spendByEnvelope"]): number {
	return rows.reduce((total: number, row: SpendRow) => total + row.spentCents, 0);
}

function toSegments(
	report: ClosePayload["report"],
	spentCents: number,
	surplusCents: number | null,
): CloseSegmentView[] {
	const whole =
		report.totalIncomeCents > 0 ? report.totalIncomeCents : spentCents + (surplusCents ?? 0);
	if (whole <= 0) return [];
	const segments: CloseSegmentView[] = report.spendByEnvelope.map((row: SpendRow) => ({
		tone: row.type,
		percent: barPercent(row.spentCents, whole),
		label: row.label,
	}));
	if (surplusCents != null) {
		segments.push({
			tone: "surplus",
			percent: barPercent(surplusCents, whole),
			label: "Sobró",
		});
	}
	return segments.filter((segment) => segment.percent > 0);
}

function barPercent(part: number, whole: number): number {
	if (whole <= 0 || part <= 0) return 0;
	return Math.min(100, Math.max(0, Math.round((part / whole) * 100)));
}

function streakSubtitle(streak: number): string {
	if (streak <= 0) return "La racha vuelve a empezar.";
	if (streak === 1) return "Primer ciclo de la racha.";
	return `${streak} ciclos seguidos.`;
}
