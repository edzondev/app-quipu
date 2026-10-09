import type { api } from "@quipu/convex-api";
import type { FunctionReturnType } from "convex/server";
import { envelopeCarryLabel } from "@/shared/lib/dashboard/home-model";
import { formatCentsTrimmed } from "@/shared/lib/money";
import { marketFromCurrencyCode } from "@/shared/lib/onboarding/markets";

type DashboardSummary = NonNullable<FunctionReturnType<typeof api.dashboard.getSummary>>;
type SummaryEnvelope = DashboardSummary["envelopes"][number];
type SummaryCommitment = DashboardSummary["commitments"][number];

export type SavingsOverview = FunctionReturnType<typeof api.savings.getOverview>;

export type SobresTone = "needs" | "wants" | "savings";
export type SobresStatusTone = "calm" | "fast";

export type SobresEnvelopeView = {
	tone: SobresTone;
	label: string;
	statusLabel: string | null;
	statusTone: SobresStatusTone;
	symbol: string;
	negative: boolean;
	amountLabel: string;
	budgetLabel: string;
	progress: number;
	footLeft: string | null;
	footRight: string | null;
	footRightTone: SobresStatusTone;
	/** Null en el ciclo de apertura o cuando no hubo arrastre. */
	carryLabel: string | null;
};

export type SobresScreenModel = {
	dayLabel: string;
	envelopes: SobresEnvelopeView[];
};

const ORDER: readonly SobresTone[] = ["needs", "wants", "savings"];

const LABEL: Record<SobresTone, string> = {
	needs: "Necesidades",
	wants: "Gustos",
	savings: "Ahorro",
};

const CALM = "calm" as const;
const FAST = "fast" as const;

export function mapSobresScreen(
	summary: DashboardSummary | null,
	savingsLine: string | null = null,
): SobresScreenModel | null {
	if (!summary?.cycle) return null;
	const symbol = marketFromCurrencyCode(summary.profile.currencyCode)?.currencySymbol ?? "S/";
	const byType = new Map<SobresTone, SummaryEnvelope>();
	for (const envelope of summary.envelopes) {
		const tone = readTone(envelope.type);
		if (tone) byType.set(tone, envelope);
	}

	return {
		dayLabel: `DÍA ${summary.cycle.daysElapsed} / ${summary.cycle.daysTotal}`,
		envelopes: ORDER.flatMap((tone) => {
			const envelope = byType.get(tone);
			if (!envelope) return [];
			return [
				toEnvelopeView(
					envelope,
					tone,
					symbol,
					summary.cycle,
					summary.commitments,
					savingsLine,
					summary.cycle.isOpeningCycle,
				),
			];
		}),
	};
}

export function savingsLineFromOverview(overview: SavingsOverview | undefined): string | null {
	if (overview == null) return null;
	const names: string[] = [];
	const fund = readLabel(overview.emergencyFund);
	if (fund) names.push(fund);
	if (Array.isArray(overview.goals)) {
		for (const goal of overview.goals) {
			const label = readLabel(goal);
			if (label) names.push(label);
		}
	}
	if (names.length === 0) return null;
	return names.join(" + ").toLocaleUpperCase("es-PE");
}

function toEnvelopeView(
	envelope: SummaryEnvelope,
	tone: SobresTone,
	symbol: string,
	cycle: NonNullable<DashboardSummary["cycle"]>,
	commitments: DashboardSummary["commitments"],
	savingsLine: string | null,
	isOpeningCycle: boolean,
): SobresEnvelopeView {
	const carryLabel = envelopeCarryLabel(
		envelope.carriedOverCents,
		envelope.incomeCents,
		envelope.totalCents,
		symbol,
		isOpeningCycle,
	);
	const allocated = envelope.allocatedAmount;
	const remaining = envelope.remainingAmount;
	const spent = Math.max(0, allocated - remaining);
	const amount = solesParts(remaining);
	const budgetDays = budgetDaysLeft(remaining, allocated, cycle.daysTotal);
	const fast =
		tone !== "savings" &&
		(remaining < 0 || (spent > 0 && budgetDays !== null && budgetDays < cycle.daysRemaining));

	if (tone === "savings") {
		const intact = allocated > 0 && remaining >= allocated;
		const progress = allocated > 0 ? clampPercent((remaining / allocated) * 100) : 0;
		return {
			tone,
			label: LABEL.savings,
			statusLabel: intact ? "Intacto" : null,
			statusTone: CALM,
			symbol,
			negative: amount.negative,
			amountLabel: amount.body,
			budgetLabel: "apartado este ciclo",
			progress,
			footLeft: savingsLine,
			footRight: allocated > 0 ? `${progress}%` : null,
			footRightTone: CALM,
			carryLabel,
		};
	}

	const progress = allocated > 0 ? clampPercent((spent / allocated) * 100) : 0;
	const pending = !fast && allocated > 0 ? pendingCommitment(commitments, tone) : null;

	return {
		tone,
		label: LABEL[tone],
		statusLabel: fast ? "Va rápido" : allocated > 0 ? "Al día" : null,
		statusTone: fast ? FAST : CALM,
		symbol,
		negative: amount.negative,
		amountLabel: amount.body,
		budgetLabel: `de ${formatCentsTrimmed(allocated, symbol)}`,
		progress,
		footLeft: `GASTADO ${formatCentsTrimmed(spent, symbol)}`,
		footRight: fast ? alcanzaLabel(budgetDays ?? 0) : pending,
		footRightTone: fast ? FAST : CALM,
		carryLabel,
	};
}

/** Days of the planned daily budget still covered — 1h "ALCANZA N DÍAS". */
function budgetDaysLeft(remaining: number, allocated: number, daysTotal: number): number | null {
	if (allocated <= 0 || daysTotal <= 0) return null;
	if (remaining <= 0) return 0;
	return Math.floor((remaining * daysTotal) / allocated);
}

function alcanzaLabel(days: number): string {
	const count = Math.max(0, Math.trunc(days));
	return count === 1 ? "ALCANZA 1 DÍA" : `ALCANZA ${count} DÍAS`;
}

function pendingCommitment(
	commitments: DashboardSummary["commitments"],
	tone: "needs" | "wants",
): string | null {
	const pending = commitments
		.filter(
			(commitment: SummaryCommitment) =>
				commitment.envelope === tone && commitment.paymentStatus !== "paid",
		)
		.sort((a: SummaryCommitment, b: SummaryCommitment) => a.daysUntilDue - b.daysUntilDue);
	const name = pending[0]?.name.trim();
	if (!name) return null;
	return `${name.toLocaleUpperCase("es-PE")} PENDIENTE`;
}

function readTone(value: SummaryEnvelope["type"]): SobresTone | null {
	if (value === "needs" || value === "wants" || value === "savings") {
		return value;
	}
	return null;
}

function readLabel(value: { label?: string | null } | null | undefined): string | null {
	if (!value || typeof value.label !== "string") return null;
	const label = value.label.trim();
	return label.length > 0 ? label : null;
}

function solesParts(cents: number): { negative: boolean; body: string } {
	const negative = cents < 0;
	const abs = Math.abs(Math.trunc(cents));
	const whole = Math.floor(abs / 100);
	const fraction = abs % 100;
	const grouped = whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
	const body = fraction === 0 ? grouped : `${grouped}.${String(fraction).padStart(2, "0")}`;
	return { negative, body };
}

function clampPercent(value: number): number {
	if (!Number.isFinite(value)) return 0;
	return Math.min(100, Math.max(0, Math.round(value)));
}
