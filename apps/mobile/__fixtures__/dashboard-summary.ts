import type { api } from "@quipu/convex-api";
import type { FunctionReturnType } from "convex/server";
import { fixtureId } from "@/__fixtures__/convex-id";

type DashboardSummary = NonNullable<FunctionReturnType<typeof api.dashboard.getSummary>>;

export const emptyEnvelopeCarry = { carriedOverCents: 0, incomeCents: 0, totalCents: 0 };
export const emptyCycleCarry = {
	carriedOverFromCycleId: null,
	carriedOverExtraordinaryCents: 0,
};
type ActiveSummary = Extract<DashboardSummary, { cycle: { startDate: number } }>;
type IdleSummary = Extract<DashboardSummary, { cycle: null }>;
type SummaryCommitment = ActiveSummary["commitments"][number];
type IdleCommitment = IdleSummary["commitments"][number];

export function commitment(
	overrides: Omit<Partial<SummaryCommitment>, "id"> & { id: string },
): SummaryCommitment {
	const amount = overrides.amount ?? 0;
	return {
		id: fixtureId("fixedCommitments", overrides.id),
		name: overrides.name ?? "",
		amount,
		envelope: overrides.envelope ?? "needs",
		dueDay: overrides.dueDay ?? 1,
		nextDueAt: overrides.nextDueAt ?? 0,
		daysUntilDue: overrides.daysUntilDue ?? 0,
		covered: overrides.covered ?? 0,
		remaining: overrides.remaining ?? amount,
		progressPercent: overrides.progressPercent ?? 0,
		coverageStatus: overrides.coverageStatus ?? "uncovered",
		cascadeStatus: overrides.cascadeStatus ?? "not-started",
		paymentStatus: overrides.paymentStatus ?? "pending",
		paidAtForCycle: overrides.paidAtForCycle,
	};
}

const AUGUST_START = Date.UTC(2026, 7, 1, 5, 0, 0);

export function envelope(
	type: "needs" | "wants" | "savings",
	remainingAmount: number,
	allocatedAmount = remainingAmount,
): ActiveSummary["envelopes"][number] {
	return {
		type,
		remainingAmount,
		allocatedAmount,
		percentRemaining: 0,
		...emptyEnvelopeCarry,
		incomeCents: allocatedAmount,
		totalCents: allocatedAmount,
	};
}

/** Ciclo de agosto con el reparto del diseño 3i (1,138 / 231 / 700). */
export function summaryWithCycle(
	overrides: {
		envelopes?: ActiveSummary["envelopes"];
		commitments?: ActiveSummary["commitments"];
	} = {},
): ActiveSummary {
	const summary = {
		profile: {
			name: "Edzon",
			currencyCode: "PEN",
			plan: "free",
			allocationNeeds: 50,
			allocationWants: 30,
			allocationSavings: 20,
		},
		cycle: {
			id: fixtureId("financialCycles", "cycle"),
			startDate: AUGUST_START,
			endDate: AUGUST_START,
			needsReview: false,
			unallocatedCents: 0,
			...emptyCycleCarry,
			daysTotal: 30,
			daysRemaining: 15,
			daysElapsed: 15,
			progressPercent: 50,
			pastEnd: false,
		},
		hero: {
			dailyAvailableCents: 0,
			displayDailyCents: 0,
			bodyCopy: undefined,
			validationCopy: undefined,
			statusBadge: "stable",
			spendableCents: 0,
			reservedCents: 0,
			unallocatedCents: 0,
		},
		liquidity: {
			spendableCents: 0,
			reservedCents: 0,
			unallocatedCents: 0,
			savingsParkedInEnvelopeCents: 0,
		},
		envelopes: overrides.envelopes ?? [
			envelope("needs", 113800, 175000),
			envelope("wants", 23100, 105000),
			envelope("savings", 70000, 70000),
		],
		coach: {
			kind: "tranquil",
			message: "",
			interactionId: undefined,
			options: undefined,
			crisisOptions: undefined,
			crisisPlan: undefined,
			rescueSuggestion: undefined,
			awaitingRescueConfirmation: false,
		},
		commitments: overrides.commitments ?? [],
		movements: [],
		isEarlyCycle: false,
		closedCycle: null,
	} satisfies ActiveSummary;
	return summary;
}

/** Compromiso del resumen sin ciclo: el backend lo deja descubierto y pendiente. */
export function idleCommitment(
	overrides: Omit<Partial<IdleCommitment>, "id" | "paidAtForCycle"> & { id: string },
): IdleCommitment {
	const amount = overrides.amount ?? 0;
	return {
		id: fixtureId("fixedCommitments", overrides.id),
		name: overrides.name ?? "",
		amount,
		envelope: overrides.envelope ?? "needs",
		dueDay: overrides.dueDay ?? 1,
		nextDueAt: overrides.nextDueAt ?? 0,
		daysUntilDue: overrides.daysUntilDue ?? 0,
		covered: overrides.covered ?? 0,
		remaining: overrides.remaining ?? amount,
		progressPercent: overrides.progressPercent ?? 0,
		coverageStatus: "uncovered",
		cascadeStatus: "not-started",
		paymentStatus: "pending",
		paidAtForCycle: undefined,
	};
}

/** Resumen sin ciclo activo, compartido por home y sobres. */
export const summaryWithoutCycle: IdleSummary = {
	profile: {
		name: "Edzon",
		currencyCode: "PEN",
		plan: "free",
		allocationNeeds: 50,
		allocationWants: 30,
		allocationSavings: 20,
	},
	cycle: null,
	hero: null,
	envelopes: [],
	commitments: [],
	coach: null,
	movements: [],
	isEarlyCycle: false,
	closedCycle: null,
} satisfies IdleSummary;
