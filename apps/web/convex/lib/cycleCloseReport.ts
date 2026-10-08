import { ENVELOPE_LABELS } from "../../shared/constants/envelopes";

const LIMA_TIMEZONE = "America/Lima";
const MS_PER_DAY = 86_400_000;
const JUST_CLOSED_MAX_DAYS = 7;
const CYCLE_MONTH_FORMATTER = new Intl.DateTimeFormat("es-PE", {
	timeZone: LIMA_TIMEZONE,
	month: "long",
});

const ENVELOPE_ORDER = ["needs", "wants", "savings"] as const;

export type CycleCloseReportEnvelopeSpend = {
	type: (typeof ENVELOPE_ORDER)[number];
	label: string;
	spentCents: number;
};

export type CycleCloseReport = {
	cycleLabel: string;
	totalIncomeCents: number;
	spendByEnvelope: CycleCloseReportEnvelopeSpend[];
	savingsCents: number;
	streak: number;
	status: "compliant" | "warning" | "failed";
	hasExtraordinaryIncome: boolean;
};

export type CycleCloseReportInput = {
	cycleStartDate: number;
	incomeEvents: ReadonlyArray<{
		amount: number;
		incomeKind?: "habitual" | "extraordinary";
	}>;
	envelopes: ReadonlyArray<{
		type: "needs" | "wants" | "savings";
		allocatedAmount: number;
		remainingAmount: number;
	}>;
	cycleHistory: {
		status: "compliant" | "warning" | "failed";
	};
	streak: number;
};

export function buildCycleLabel(cycleStartDate: number): string {
	const month = CYCLE_MONTH_FORMATTER.format(new Date(cycleStartDate));
	return month.charAt(0).toUpperCase() + month.slice(1);
}

export function computeEnvelopeSpentCents(
	allocatedAmount: number,
	remainingAmount: number,
): number {
	return Math.max(0, allocatedAmount - remainingAmount);
}

export function computeSavingsSetAsideCents(input: {
	allocatedAmount: number;
	remainingAmount: number;
}): number {
	return Math.max(0, input.allocatedAmount - input.remainingAmount);
}

export function isCloseReportEligible(closedAtPremium: boolean | undefined): boolean {
	return closedAtPremium === true;
}

export function isJustClosedAfterCycleClose(params: {
	activeCycleDaysElapsed: number;
	closedCycleEvaluatedAt: number;
	now: number;
}): boolean {
	if (params.activeCycleDaysElapsed > JUST_CLOSED_MAX_DAYS) return false;
	const msSinceClose = params.now - params.closedCycleEvaluatedAt;
	return msSinceClose >= 0 && msSinceClose <= JUST_CLOSED_MAX_DAYS * MS_PER_DAY;
}

export function buildCycleCloseReport(input: CycleCloseReportInput): CycleCloseReport {
	const totalIncomeCents = input.incomeEvents.reduce((sum, event) => sum + event.amount, 0);
	const hasExtraordinaryIncome = input.incomeEvents.some(
		(event) => event.incomeKind === "extraordinary",
	);

	const spendByEnvelope = ENVELOPE_ORDER.map((type) => {
		const envelope = input.envelopes.find((row) => row.type === type);
		const spentCents = envelope
			? computeEnvelopeSpentCents(envelope.allocatedAmount, envelope.remainingAmount)
			: 0;
		return {
			type,
			label: ENVELOPE_LABELS[type],
			spentCents,
		};
	});

	const savingsEnvelope = input.envelopes.find((row) => row.type === "savings");
	const savingsCents = savingsEnvelope ? computeSavingsSetAsideCents(savingsEnvelope) : 0;

	return {
		cycleLabel: buildCycleLabel(input.cycleStartDate),
		totalIncomeCents,
		spendByEnvelope,
		savingsCents,
		streak: input.streak,
		status: input.cycleHistory.status,
		hasExtraordinaryIncome,
	};
}
