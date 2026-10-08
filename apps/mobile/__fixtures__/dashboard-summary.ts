import type { api } from "@quipu/convex-api";
import type { FunctionReturnType } from "convex/server";
import { fixtureId } from "@/__fixtures__/convex-id";

type DashboardSummary = NonNullable<FunctionReturnType<typeof api.dashboard.getSummary>>;
type ActiveSummary = Extract<DashboardSummary, { cycle: { startDate: number } }>;
type SummaryCommitment = ActiveSummary["commitments"][number];

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

/** Resumen sin ciclo activo, compartido por home y sobres. */
export const summaryWithoutCycle = {
	profile: { name: "Edzon", currencyCode: "PEN", plan: "free" },
	cycle: null,
	hero: null,
	envelopes: [],
	commitments: [],
	coach: null,
	movements: [],
	isEarlyCycle: false,
} satisfies Extract<DashboardSummary, { cycle: null }>;
