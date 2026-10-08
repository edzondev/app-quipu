import type { api } from "@quipu/convex-api";
import type { FunctionReturnType } from "convex/server";
import { LIMA_MONTHS, limaStamp } from "@/shared/lib/lima-date";
import { formatCentsTrimmed } from "@/shared/lib/money";
import { marketFromCurrencyCode } from "@/shared/lib/onboarding/markets";

export type ProgressOverview = FunctionReturnType<typeof api.progress.getOverview>;
export type ProgressRewards = FunctionReturnType<typeof api.progress.getRewards>;
export type SavingsOverview = FunctionReturnType<typeof api.savings.getOverview>;
export type CloseReportResult = FunctionReturnType<typeof api.cycleReport.getLatestCloseReport>;

type Overview = NonNullable<ProgressOverview>;
type ClosePayload = NonNullable<CloseReportResult>;

export type BarTone = "compliant" | "warning" | "failed" | "empty";

export type ProgressBarView = {
	key: string;
	tone: Exclude<BarTone, "empty">;
	monthLabel: string;
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
	achievements: AchievementRowView[];
	rewardText: string | null;
	closeEntry: CloseEntryView | null;
};

export type CloseSegmentTone = "needs" | "wants" | "savings" | "surplus";

export type CloseSegmentView = {
	tone: CloseSegmentTone;
	percent: number;
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
	/** El reporte no trae fromEnvelope. La acción de mover queda oculta. */
	showMove: false;
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
	const empty = closeEntry == null && streak === 0 && bars.length === 0;

	return {
		empty,
		streakLabel: String(streak),
		sinceLabel: sinceLabel(bars),
		bars,
		savedLabel: savedLabel(savings),
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
	const symbol = currencySymbol(savings);
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
		subtitle: streakSubtitle(report.streak, report.status),
		spentLabel: `GASTADO ${formatCentsTrimmed(spentCents, symbol)}`,
		surplusLabel: surplusCents == null ? null : `SOBRÓ ${formatCentsTrimmed(surplusCents, symbol)}`,
		segments: toSegments(report, spentCents, surplusCents),
		rows: toRows(report.spendByEnvelope, symbol),
		showMove: false,
	};
}

function toBars(chartBars: Overview["chartBars"]): ProgressBarView[] {
	const bars: ProgressBarView[] = [];
	for (const bar of chartBars) {
		if (bar.status === "empty" || bar.id <= 0) continue;
		if (bar.status !== "compliant" && bar.status !== "warning" && bar.status !== "failed") {
			continue;
		}
		const month = LIMA_MONTHS[limaStamp(bar.id).monthIndex];
		if (!month) continue;
		bars.push({ key: String(bar.id), tone: bar.status, monthLabel: month });
	}
	return bars;
}

function sinceLabel(bars: ProgressBarView[]): string | null {
	const first = bars[0];
	if (!first) return null;
	return `DESDE ${first.monthLabel}`;
}

function savedLabel(savings: SavingsOverview): string | null {
	if (savings == null) return null;
	return formatCentsTrimmed(savings.totalSavedCents, currencySymbol(savings));
}

function currencySymbol(savings: SavingsOverview): string {
	if (savings == null) return "S/";
	return marketFromCurrencyCode(savings.profile.currencyCode)?.currencySymbol ?? "S/";
}

function toAchievements(achievements: Overview["achievements"]): AchievementRowView[] {
	const rows: AchievementRowView[] = [];
	for (const achievement of achievements) {
		rows.push({
			key: achievement.id,
			title: achievement.title,
			done: achievement.state === "done",
			detail: achievementDetail(achievement),
		});
	}
	return rows;
}

function achievementDetail(achievement: Overview["achievements"][number]): string | null {
	if (achievement.state === "done" && achievement.earnedAt != null) {
		return LIMA_MONTHS[limaStamp(achievement.earnedAt).monthIndex] ?? null;
	}
	if (achievement.state === "locked" && achievement.lockedHint) return achievement.lockedHint;
	return null;
}

function nextRewardText(rewards: ProgressRewards): string | null {
	if (rewards == null) return null;
	for (const reward of rewards.rewards) {
		if (reward.unlocked) continue;
		const remaining =
			"cyclesRemaining" in reward && reward.cyclesRemaining != null
				? reward.cyclesRemaining
				: Math.max(0, reward.requiredStreak - rewards.currentStreak);
		const wait = remaining > 0 ? `Faltan ${remaining} ciclos para ${reward.title}. ` : "";
		return `${wait}${reward.description}`;
	}
	return null;
}

function toCloseEntry(closeReport: CloseReportResult): CloseEntryView | null {
	if (closeReport == null) return null;
	return {
		label: `CICLO CERRADO · ${closeReport.report.cycleLabel.toLocaleUpperCase("es-PE")}`,
		highlighted: closeReport.justClosed,
	};
}

function toRows(rows: ClosePayload["report"]["spendByEnvelope"], symbol: string): CloseRowView[] {
	const views: CloseRowView[] = [];
	for (const row of rows) {
		views.push({
			label: row.label,
			amountLabel: formatCentsTrimmed(row.spentCents, symbol),
		});
	}
	return views;
}

function spentTotal(rows: ClosePayload["report"]["spendByEnvelope"]): number {
	let total = 0;
	for (const row of rows) total += row.spentCents;
	return total;
}

function toSegments(
	report: ClosePayload["report"],
	spentCents: number,
	surplusCents: number | null,
): CloseSegmentView[] {
	const whole =
		report.totalIncomeCents > 0 ? report.totalIncomeCents : spentCents + (surplusCents ?? 0);
	if (whole <= 0) return [];
	const segments: CloseSegmentView[] = [];
	for (const row of report.spendByEnvelope) {
		segments.push({ tone: row.type, percent: barPercent(row.spentCents, whole) });
	}
	if (surplusCents != null) {
		segments.push({ tone: "surplus", percent: barPercent(surplusCents, whole) });
	}
	return segments;
}

function barPercent(part: number, whole: number): number {
	if (whole <= 0 || part <= 0) return 0;
	return Math.min(100, Math.max(0, Math.round((part / whole) * 100)));
}

function streakSubtitle(streak: number, status: ClosePayload["report"]["status"]): string {
	const tone =
		status === "compliant" ? "en verde" : status === "warning" ? "con aviso" : "sin cumplir";
	if (streak <= 1) return `Primer ciclo ${tone}.`;
	return `${streak} ciclos seguidos ${tone}.`;
}
