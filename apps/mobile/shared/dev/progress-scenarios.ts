import { fixtureId } from "@/__fixtures__/convex-id";
import { savingsOverview } from "@/__fixtures__/savings-overview";
import type {
	CloseReportResult,
	ProgressOverview,
	ProgressRewards,
	SavingsOverview,
} from "@/shared/lib/progress/model";

/**
 * Escenarios de prueba para validar Progreso sin esperar a que cierre un ciclo.
 * Solo se cargan en desarrollo (ver `use-progress-preview.ts`). Cada pieza está tipada con lo
 * que devuelve Convex, así que si el backend cambia de forma esto deja de compilar.
 */
export type ProgressSource = {
	overview: ProgressOverview;
	rewards: ProgressRewards;
	savings: SavingsOverview;
	closeReport: CloseReportResult;
};

type Overview = NonNullable<ProgressOverview>;
type Rewards = NonNullable<ProgressRewards>;
type Close = NonNullable<CloseReportResult>;
type Bar = Overview["chartBars"][number];
type Achievement = Overview["achievements"][number];

/** Mediodía de Lima: cae en el mismo día de calendario en cualquier zona del dispositivo. */
function at(iso: string): number {
	return Date.parse(`${iso}T17:00:00.000Z`);
}

function bar(status: Exclude<Bar["status"], "empty">, iso: string, monthLabel: string): Bar {
	return { id: at(iso), status, heightPx: 26, cycleStart: at(iso), monthLabel };
}

function done(id: Achievement["id"], title: string, iso: string): Achievement {
	return { id, title, state: "done", earnedAt: at(iso), lockedHint: null };
}

function locked(id: Achievement["id"], title: string, lockedHint: string): Achievement {
	return { id, title, state: "locked", earnedAt: null, lockedHint };
}

const APPEARANCE = { theme: "light", accent: "moss", appIcon: "light" } as const;

const TINTA = {
	id: "tinta_theme",
	title: "Tema Tinta",
	description: "Modo oscuro sobrio · desbloqueado con 3 ciclos",
	requiredStreak: 3,
	active: false,
} as const;

const ARCILLA = {
	id: "clay_accent",
	title: "Acento Arcilla",
	description: "Paleta alterna · desbloqueado con 6 ciclos",
	requiredStreak: 6,
	active: false,
} as const;

function rewards(currentStreak: number, annualCyclesRemaining: number): Rewards {
	return {
		currentStreak,
		appearance: APPEARANCE,
		rewards: [
			{ ...TINTA, unlocked: currentStreak >= TINTA.requiredStreak },
			{ ...ARCILLA, unlocked: currentStreak >= ARCILLA.requiredStreak },
			{
				id: "annual_report",
				title: "Informe anual",
				description: "Tu año en un resumen · desbloqueado con 12 ciclos",
				unlocked: annualCyclesRemaining <= 0,
				requiredStreak: 12,
				active: false,
				cyclesRemaining: Math.max(0, annualCyclesRemaining),
			},
		],
		accents: [],
		themes: [],
		appIcons: [],
	};
}

function saved(totalSavedCents: number) {
	return { ...savingsOverview, totalSavedCents } satisfies NonNullable<SavingsOverview>;
}

function closeReport(
	input: Pick<Close["report"], "cycleLabel" | "status" | "streak" | "totalIncomeCents"> & {
		justClosed: boolean;
		spend: readonly [needs: number, wants: number, savings: number];
	},
): Close {
	const [needs, wants, savings] = input.spend;
	return {
		justClosed: input.justClosed,
		report: {
			closedCycleId: fixtureId("financialCycles", "preview-cycle"),
			cycleLabel: input.cycleLabel,
			totalIncomeCents: input.totalIncomeCents,
			spendByEnvelope: [
				{ type: "needs", label: "Necesidades", spentCents: needs },
				{ type: "wants", label: "Gustos", spentCents: wants },
				{ type: "savings", label: "Ahorro", spentCents: savings },
			],
			savingsCents: savings,
			streak: input.streak,
			streakEvaluated: true,
			status: input.status,
			hasExtraordinaryIncome: false,
		},
	};
}

export const PROGRESS_SCENARIOS = {
	/** Usuario nuevo: sin ciclos cerrados ni racha. Vista vacía. */
	sinCiclos: {
		label: "Sin ciclos",
		source: {
			overview: {
				currentStreak: 0,
				longestStreak: 0,
				chartBars: [bar("current", "2026-10-01", "Octubre")],
				achievements: [
					locked("first_cycle_closed", "Primer ciclo cerrado", "Cierra tu primer ciclo"),
					locked("emergency_fund_25", "Fondo al 25%", "Te falta S/ 800 para el 25%"),
				],
				achievementsDoneCount: 0,
				achievementsTotal: 2,
				registeredExpenseCount: 4,
				daysWithoutSkipping: 4,
			},
			rewards: rewards(0, 12),
			savings: saved(0),
			closeReport: null,
		},
	},
	/** El primer ciclo se acaba de cerrar en verde: entrada resaltada y pantalla de cierre. */
	primerCierre: {
		label: "Primer cierre",
		source: {
			overview: {
				currentStreak: 1,
				longestStreak: 1,
				chartBars: [
					bar("compliant", "2026-09-01", "Setiembre"),
					bar("current", "2026-10-01", "Octubre"),
				],
				achievements: [
					done("first_cycle_closed", "Primer ciclo cerrado", "2026-10-01"),
					locked("emergency_fund_25", "Fondo al 25%", "Te falta S/ 800 para el 25%"),
				],
				achievementsDoneCount: 1,
				achievementsTotal: 2,
				registeredExpenseCount: 58,
				daysWithoutSkipping: 30,
			},
			rewards: rewards(1, 11),
			savings: saved(40000),
			closeReport: closeReport({
				justClosed: true,
				cycleLabel: "Setiembre",
				status: "compliant",
				streak: 1,
				totalIncomeCents: 350000,
				spend: [180000, 90000, 40000],
			}),
		},
	},
	/** Seis ciclos en verde: logros, recompensas desbloqueadas y cierre ya visto. */
	rachaSeis: {
		label: "Racha de 6",
		source: {
			overview: {
				currentStreak: 6,
				longestStreak: 6,
				chartBars: [
					bar("compliant", "2026-04-01", "Abril"),
					bar("compliant", "2026-05-01", "Mayo"),
					bar("compliant", "2026-06-01", "Junio"),
					bar("compliant", "2026-07-01", "Julio"),
					bar("compliant", "2026-08-01", "Agosto"),
					bar("compliant", "2026-09-01", "Setiembre"),
					bar("current", "2026-10-01", "Octubre"),
				],
				achievements: [
					done("first_cycle_closed", "Primer ciclo cerrado", "2026-05-01"),
					done("emergency_fund_25", "Fondo al 25%", "2026-07-01"),
					done("three_cycles_wants_discipline", "3 ciclos sin exceder Gustos", "2026-07-01"),
					locked("six_times_all_covered", "Todo cubierto, 6 veces", "Te falta 1 ciclo"),
					locked("emergency_fund_complete", "Fondo completo · 3 meses", "Te falta S/ 4,200"),
					locked("one_year_in_order", "Un año en orden", "Te faltan 6 ciclos"),
				],
				achievementsDoneCount: 3,
				achievementsTotal: 6,
				registeredExpenseCount: 412,
				daysWithoutSkipping: 181,
			},
			rewards: rewards(6, 6),
			savings: saved(1260000),
			closeReport: closeReport({
				justClosed: false,
				cycleLabel: "Setiembre",
				status: "compliant",
				streak: 6,
				totalIncomeCents: 420000,
				spend: [210000, 110000, 60000],
			}),
		},
	},
	/** Un ciclo en rojo: la racha vuelve a cero y no sobró nada. Mezcla verde, aviso y rojo. */
	rachaRota: {
		label: "Racha rota",
		source: {
			overview: {
				currentStreak: 0,
				longestStreak: 4,
				chartBars: [
					bar("compliant", "2026-05-01", "Mayo"),
					bar("compliant", "2026-06-01", "Junio"),
					bar("warning", "2026-07-01", "Julio"),
					bar("compliant", "2026-08-01", "Agosto"),
					bar("failed", "2026-09-01", "Setiembre"),
					bar("current", "2026-10-01", "Octubre"),
				],
				achievements: [
					done("first_cycle_closed", "Primer ciclo cerrado", "2026-06-01"),
					locked("emergency_fund_25", "Fondo al 25%", "Te falta S/ 350 para el 25%"),
				],
				achievementsDoneCount: 1,
				achievementsTotal: 2,
				registeredExpenseCount: 266,
				daysWithoutSkipping: 12,
			},
			rewards: rewards(0, 12),
			savings: saved(310000),
			closeReport: closeReport({
				justClosed: true,
				cycleLabel: "Setiembre",
				status: "failed",
				streak: 0,
				totalIncomeCents: 300000,
				spend: [190000, 140000, 0],
			}),
		},
	},
} satisfies Record<string, { label: string; source: ProgressSource }>;

export type ProgressScenarioId = keyof typeof PROGRESS_SCENARIOS;

export const PROGRESS_SCENARIO_IDS = Object.keys(PROGRESS_SCENARIOS) as ProgressScenarioId[];
