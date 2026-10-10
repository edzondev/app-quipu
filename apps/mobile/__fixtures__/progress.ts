import { fixtureId } from "@/__fixtures__/convex-id";
import type {
	CloseReportResult,
	ProgressOverview,
	ProgressRewards,
} from "@/shared/lib/progress/model";

const MAY = Date.parse("2026-05-15T17:00:00.000Z");
const SEP = Date.parse("2026-09-15T17:00:00.000Z");

/** Overview de progress.getOverview, con los campos de chartBars y los contadores. */
export const progressOverview = {
	currentStreak: 3,
	longestStreak: 3,
	chartBars: [
		{
			id: -1,
			status: "empty" as const,
			heightPx: 0,
			cycleStart: null,
			monthLabel: null,
			countsForStreak: false,
		},
		{
			id: MAY,
			status: "compliant" as const,
			heightPx: 26,
			cycleStart: MAY,
			monthLabel: "Mayo",
			countsForStreak: true,
		},
		{
			id: SEP,
			status: "warning" as const,
			heightPx: 22,
			cycleStart: SEP,
			monthLabel: "Setiembre",
			countsForStreak: true,
		},
	],
	achievements: [
		{
			id: "first_cycle_closed" as const,
			title: "Primer ciclo cerrado",
			state: "done" as const,
			earnedAt: MAY,
			lockedHint: null,
		},
		{
			id: "emergency_fund_25" as const,
			title: "Fondo al 25%",
			state: "locked" as const,
			earnedAt: null,
			lockedHint: "Te falta S/ 200 para el 25%",
		},
	],
	achievementsDoneCount: 1,
	achievementsTotal: 2,
	registeredExpenseCount: 312,
	daysWithoutSkipping: 46,
} satisfies NonNullable<ProgressOverview>;

export const progressRewards = {
	currentStreak: 3,
	appearance: { theme: "light" as const, accent: "moss" as const, appIcon: "light" as const },
	rewards: [
		{
			id: "tinta_theme" as const,
			title: "Tema Tinta",
			description: "Modo oscuro sobrio · desbloqueado con 3 ciclos",
			unlocked: true,
			requiredStreak: 3,
			active: false,
		},
		{
			id: "clay_accent" as const,
			title: "Acento Arcilla",
			description: "Paleta alterna · desbloqueado con 6 ciclos",
			unlocked: false,
			requiredStreak: 6,
			active: false,
		},
	],
	accents: [],
	themes: [],
	appIcons: [],
} satisfies NonNullable<ProgressRewards>;

export const closeReport = {
	justClosed: true,
	report: {
		closedCycleId: fixtureId("financialCycles", "cycle-1"),
		cycleLabel: "Julio",
		totalIncomeCents: 350000,
		spendByEnvelope: [
			{ type: "needs" as const, label: "Necesidades", spentCents: 200000 },
			{ type: "wants" as const, label: "Gustos", spentCents: 100000 },
			{ type: "savings" as const, label: "Ahorro", spentCents: 29000 },
		],
		savingsCents: 29000,
		streak: 3,
		streakEvaluated: true,
		status: "compliant" as const,
		hasExtraordinaryIncome: false,
	},
} satisfies NonNullable<CloseReportResult>;
