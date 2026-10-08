import type { api } from "@quipu/convex-api";
import type { FunctionReturnType } from "convex/server";
import { limaMonthName } from "@/shared/lib/lima-date";
import { currencySymbol, formatCentsTrimmed } from "@/shared/lib/money";
import { repartoLabel, type SettingsOverview } from "@/shared/lib/settings/model";

type DashboardSummary = NonNullable<FunctionReturnType<typeof api.dashboard.getSummary>>;
type SummaryCommitment = DashboardSummary["commitments"][number];
type EnvelopeType = DashboardSummary["envelopes"][number]["type"];

const ENVELOPE_TYPES: readonly EnvelopeType[] = ["needs", "wants", "savings"];

export type PlanSegment = { tone: EnvelopeType; percent: number };
export type CommitmentSubtitleTone = "plain" | "warning" | "muted";

export type PlanHubModel = {
	cycleLabel: string | null;
	totalLabel: string | null;
	segments: PlanSegment[] | null;
	envelopeCount: string | null;
	commitmentsSubtitle: string;
	commitmentsTone: CommitmentSubtitleTone;
	commitmentsTotal: string;
	repartoSubtitle: string | null;
};

export function presentPlanHub(
	summary: DashboardSummary,
	settings: SettingsOverview | null,
): PlanHubModel {
	const symbol = currencySymbol(summary.profile.currencyCode);
	const commitments = presentCommitments(summary.commitments);
	const cycle = summary.cycle;
	const remaining = ENVELOPE_TYPES.map((tone) => remainingCents(summary, tone));
	const total = remaining.reduce((sum, cents) => sum + cents, 0);
	return {
		cycleLabel: cycle ? `CICLO ${limaMonthName(cycle.startDate)}` : null,
		totalLabel: cycle ? formatCentsTrimmed(total, symbol) : null,
		segments: cycle ? sharePercents(remaining) : null,
		envelopeCount: cycle ? String(summary.envelopes.length) : null,
		commitmentsSubtitle: commitments.text,
		commitmentsTone: commitments.tone,
		commitmentsTotal: formatCentsTrimmed(commitments.totalCents, symbol),
		repartoSubtitle: settings ? `${repartoLabel(settings)} · ${settings.cycle.scheduleCopy}` : null,
	};
}

function remainingCents(summary: DashboardSummary, tone: EnvelopeType): number {
	const row = summary.envelopes.find((envelope) => envelope.type === tone);
	return Math.max(0, row?.remainingAmount ?? 0);
}

function sharePercents(cents: number[]): PlanSegment[] {
	const total = cents.reduce((sum, value) => sum + value, 0);
	return ENVELOPE_TYPES.map((tone, index) => ({
		tone,
		percent: total > 0 ? Math.round(((cents[index] ?? 0) / total) * 100) : 0,
	}));
}

function presentCommitments(rows: SummaryCommitment[]): {
	text: string;
	tone: CommitmentSubtitleTone;
	totalCents: number;
} {
	const totalCents = rows.reduce((sum, row) => sum + row.amount, 0);
	const next = rows
		.filter((row) => row.paymentStatus !== "paid")
		.sort((a, b) => a.daysUntilDue - b.daysUntilDue)[0];
	if (rows.length === 0) return { text: "Sin compromisos", tone: "plain", totalCents };
	if (!next) return { text: "Todo pagado este ciclo", tone: "plain", totalCents };
	return { ...commitmentSubtitle(next), totalCents };
}

function commitmentSubtitle(next: SummaryCommitment): {
	text: string;
	tone: CommitmentSubtitleTone;
} {
	const name = next.name;
	if (next.daysUntilDue < 0) return { text: `${name} vencido`, tone: "plain" };
	if (next.daysUntilDue === 0) return { text: `${name} vence hoy`, tone: "plain" };
	if (next.daysUntilDue === 1) return { text: `${name} vence mañana`, tone: "warning" };
	return { text: `${name} vence en ${next.daysUntilDue} días`, tone: "muted" };
}
