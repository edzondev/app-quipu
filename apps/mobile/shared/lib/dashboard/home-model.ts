import type { api } from "@quipu/convex-api";
import type { FunctionReturnType } from "convex/server";
import { formatCentsTrimmed } from "@/shared/lib/money";
import { marketFromCurrencyCode } from "@/shared/lib/onboarding/markets";

type DashboardSummary = NonNullable<FunctionReturnType<typeof api.dashboard.getSummary>>;
type SummaryEnvelope = DashboardSummary["envelopes"][number];
type SummaryCommitment = DashboardSummary["commitments"][number];
type SummaryMovement = DashboardSummary["movements"][number];
type EnvelopeType = HomeEnvelope["tone"];

export type HomeTone = "needs" | "wants" | "savings" | "income";
export type BadgeTone = "stable" | "attention" | "risk" | "starting";

export type HomeEnvelope = {
	label: string;
	shortLabel: string;
	spentCents: number;
	remainingCents: number;
	/** 0–100, share of the allocation that is still in the envelope. */
	remainingPercent: number;
	totalCents: number;
	progress: number;
	tone: "needs" | "wants" | "savings";
	suffix: string;
	/** Arrastre del ciclo anterior, tal como lo trae getSummary. */
	carriedOverCents: number;
	/** Ingreso de este ciclo en el sobre, tal como lo trae getSummary. */
	incomeCents: number;
	/** Total del sobre, tal como lo trae getSummary. */
	carryTotalCents: number;
};

export type HomeMovement = {
	id: string;
	name: string;
	amountCents: number;
	tone: HomeTone;
};

export type DueTone = "soon" | "later";

export type HomeCommitment = {
	id: string;
	name: string;
	amountCents: number;
	dueLabel: string;
	dueTone: DueTone;
};

export type HomeModel = {
	cycleLabel: string;
	cycleDay: number;
	cycleTotal: number;
	daysLeft: number;
	cycleProgress: number;
	badgeLabel: string;
	badgeTone: BadgeTone;
	/** Right-column status in Home 1d, e.g. "Ciclo estable". */
	cycleStatusLabel: string;
	dailyCents: number;
	heroSubtitle: string;
	currencySymbol: string;
	envelopes: HomeEnvelope[];
	envelopesBalanceCents: number;
	/** Sum of remaining envelope balances, matching dashboard surplus projection. */
	surplusCents: number;
	coachMessage: string | null;
	commitments: HomeCommitment[];
	recentMovements: HomeMovement[];
	/** Primer ciclo: getSummary.cycle.isOpeningCycle. El dinero de hoy no es arrastre. */
	isOpeningCycle: boolean;
};

const ENVELOPE_LABEL = {
	needs: "Necesidades",
	wants: "Gustos",
	savings: "Ahorro",
} as const;

const BADGE_LABEL: Record<BadgeTone, string> = {
	stable: "Estable",
	attention: "Atención",
	risk: "En riesgo",
	starting: "Recién empiezas",
};

const CYCLE_STATUS_LABEL: Record<BadgeTone, string> = {
	stable: "Ciclo estable",
	attention: "Ciclo en atención",
	risk: "Ciclo en riesgo",
	starting: "Recién empiezas",
};

const SHORT_ENVELOPE_LABEL = {
	needs: "Necesid.",
	wants: "Gustos",
	savings: "Ahorro",
} as const;

const TONE_BY_ENVELOPE_LABEL: Record<string, HomeTone> = {
	Necesidades: "needs",
	Gustos: "wants",
	Ahorro: "savings",
};

const DEFAULT_HERO_SUBTITLE = "Sin tocar tus compromisos ni tu ahorro.";
const LIMA = "America/Lima";

export function mapDashboardHome(summary: DashboardSummary): HomeModel | null {
	if (!summary.cycle || !summary.hero) return null;
	const dailyCents = summary.hero.displayDailyCents;

	const envelopes: HomeEnvelope[] = summary.envelopes.map(mapEnvelopeRow);
	const tone = readBadgeTone(summary.hero.statusBadge);
	const symbol = marketFromCurrencyCode(summary.profile.currencyCode)?.currencySymbol ?? "S/";

	return {
		cycleLabel: cycleLabel(summary.cycle.startDate),
		cycleDay: summary.cycle.daysElapsed,
		cycleTotal: summary.cycle.daysTotal,
		daysLeft: summary.cycle.daysRemaining,
		cycleProgress: summary.cycle.progressPercent,
		badgeLabel: BADGE_LABEL[tone],
		badgeTone: tone,
		cycleStatusLabel: CYCLE_STATUS_LABEL[tone],
		dailyCents,
		heroSubtitle: summary.hero.bodyCopy?.trim() || DEFAULT_HERO_SUBTITLE,
		currencySymbol: symbol,
		envelopes,
		envelopesBalanceCents: envelopes.reduce(
			(acc, envelope) => acc + Math.max(0, envelope.remainingCents),
			0,
		),
		surplusCents: summary.envelopes.reduce(
			(acc: number, envelope: SummaryEnvelope) => acc + Math.max(0, envelope.remainingAmount),
			0,
		),
		coachMessage: summary.coach?.message ?? null,
		commitments: mapCommitments(summary.commitments),
		recentMovements: summary.movements.map((movement: SummaryMovement) => ({
			id: movement.id,
			name: movement.label.trim() || "Movimiento",
			amountCents: movement.amount,
			tone: movementTone(movement.kind, movement.envelopeLabel),
		})),
		isOpeningCycle: summary.cycle.isOpeningCycle,
	};
}

const MINUS_SIGN = "\u2212";

/** Línea de arrastre. Null si el ciclo anterior no dejó saldo. No suma los céntimos. */
export function envelopeCarryLabel(
	carriedOverCents: number,
	incomeCents: number,
	totalCents: number,
	symbol: string,
	isOpeningCycle = false,
): string | null {
	if (isOpeningCycle || carriedOverCents === 0) return null;
	const carried = formatCarryCents(carriedOverCents, symbol);
	const income = formatCarryCents(incomeCents, symbol);
	const total = formatCarryCents(totalCents, symbol);
	return `Saldo que quedó ${carried} + Ingreso ${income} = ${total}`;
}

function formatCarryCents(cents: number, symbol: string): string {
	if (cents < 0) return `${MINUS_SIGN}${formatCentsTrimmed(Math.abs(cents), symbol)}`;
	return formatCentsTrimmed(cents, symbol);
}

export function mapEnvelopeRow(envelope: SummaryEnvelope): HomeEnvelope {
	const carry = {
		carriedOverCents: envelope.carriedOverCents,
		incomeCents: envelope.incomeCents,
		carryTotalCents: envelope.totalCents,
	};
	const type = readEnvelopeType(envelope.type);
	if (type === "savings") {
		return {
			...carry,
			label: ENVELOPE_LABEL.savings,
			shortLabel: SHORT_ENVELOPE_LABEL.savings,
			spentCents: envelope.allocatedAmount,
			remainingCents: envelope.remainingAmount,
			remainingPercent: clampPercent(envelope.percentRemaining),
			totalCents: envelope.allocatedAmount,
			progress: envelope.allocatedAmount > 0 ? 100 : 0,
			tone: "savings",
			suffix: "apartado",
		};
	}

	const spentCents = Math.max(0, envelope.allocatedAmount - envelope.remainingAmount);
	const progress =
		envelope.allocatedAmount > 0
			? Math.min(100, Math.round((spentCents / envelope.allocatedAmount) * 100))
			: 0;

	return {
		...carry,
		label: ENVELOPE_LABEL[type],
		shortLabel: SHORT_ENVELOPE_LABEL[type],
		spentCents,
		remainingCents: envelope.remainingAmount,
		remainingPercent: clampPercent(envelope.percentRemaining),
		totalCents: envelope.allocatedAmount,
		progress,
		tone: type,
		suffix: `de ${formatGroupedSoles(envelope.allocatedAmount)}`,
	};
}

function mapCommitments(commitments: DashboardSummary["commitments"]): HomeCommitment[] {
	return commitments
		.filter((commitment: SummaryCommitment) => commitment.paymentStatus !== "paid")
		.slice()
		.sort((a: SummaryCommitment, b: SummaryCommitment) => a.daysUntilDue - b.daysUntilDue)
		.map((commitment: SummaryCommitment) => {
			const due = formatCommitmentDue(commitment.daysUntilDue, commitment.nextDueAt);
			return {
				id: commitment.id,
				name: commitment.name.trim() || "Compromiso",
				amountCents: commitment.amount,
				dueLabel: due.label,
				dueTone: due.tone,
			};
		});
}

export function formatCommitmentDue(
	daysUntilDue: number,
	nextDueAt: number,
): { label: string; tone: DueTone } {
	if (daysUntilDue < 0) return { label: "vencido", tone: "soon" };
	if (daysUntilDue === 0) return { label: "hoy", tone: "soon" };
	if (daysUntilDue === 1) return { label: "mañana", tone: "soon" };
	const formatted = new Intl.DateTimeFormat("es-PE", {
		day: "numeric",
		month: "short",
		timeZone: LIMA,
	})
		.format(new Date(nextDueAt))
		.replaceAll(".", "")
		.replace(/\s+de\s+/i, " ")
		.toLocaleLowerCase("es-PE")
		.trim();
	return { label: formatted, tone: "later" };
}

function readBadgeTone(value: unknown): BadgeTone {
	if (value === "stable" || value === "attention" || value === "risk" || value === "starting") {
		return value;
	}
	return "starting";
}

function readEnvelopeType(value: unknown): EnvelopeType {
	if (value === "needs" || value === "wants" || value === "savings") {
		return value;
	}
	return "needs";
}

function clampPercent(value: number): number {
	if (!Number.isFinite(value)) return 0;
	return Math.min(100, Math.max(0, Math.round(value)));
}

function cycleLabel(startDate: number): string {
	const month = new Intl.DateTimeFormat("es-PE", {
		month: "long",
		timeZone: LIMA,
	})
		.format(new Date(startDate))
		.toLocaleLowerCase("es-PE");
	return `Ciclo ${month}`;
}

function movementTone(kind: "expense" | "income", envelopeLabel?: string): HomeTone {
	if (kind !== "expense") return "income";
	return (envelopeLabel && TONE_BY_ENVELOPE_LABEL[envelopeLabel]) || "income";
}

function formatGroupedSoles(cents: number): string {
	const negative = cents < 0;
	const abs = Math.abs(cents);
	const whole = Math.floor(abs / 100);
	const fraction = abs % 100;
	const grouped = whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
	const body = fraction === 0 ? grouped : `${grouped}.${String(fraction).padStart(2, "0")}`;
	return negative ? `-${body}` : body;
}
