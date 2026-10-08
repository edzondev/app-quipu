import {
	type CloseReportResult,
	type ProgressOverview,
	type ProgressRewards,
	presentClose,
	presentProgress,
	type SavingsOverview,
} from "@/shared/lib/progress/model";

type Overview = NonNullable<ProgressOverview>;
type Rewards = NonNullable<ProgressRewards>;
type Savings = NonNullable<SavingsOverview>;
type ClosePayload = NonNullable<CloseReportResult>;

const MAY = Date.parse("2026-05-15T17:00:00.000Z");
const SEP = Date.parse("2026-09-15T17:00:00.000Z");

const overview = {
	currentStreak: 3,
	longestStreak: 3,
	chartBars: [
		{ id: -1, status: "empty" as const, heightPx: 0 },
		{ id: MAY, status: "compliant" as const, heightPx: 26 },
		{ id: SEP, status: "warning" as const, heightPx: 22 },
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
} satisfies Overview;

const rewards = {
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
} satisfies Rewards;

const savings = {
	profile: { name: "Ana", currencyCode: "PEN" },
	hasActiveCycle: true,
	totalSavedCents: 432000,
	cycleContributionCents: 0,
	emergencyFund: null,
	goals: [],
	canCreateGoal: false,
	assignPlan: null,
} satisfies Savings;

const closeReport = {
	justClosed: true,
	report: {
		closedCycleId: "cycle-1",
		cycleLabel: "Julio",
		totalIncomeCents: 350000,
		spendByEnvelope: [
			{ type: "needs" as const, label: "Necesidades", spentCents: 200000 },
			{ type: "wants" as const, label: "Gustos", spentCents: 100000 },
			{ type: "savings" as const, label: "Ahorro", spentCents: 29000 },
		],
		savingsCents: 29000,
		streak: 3,
		status: "compliant" as const,
		hasExtraordinaryIncome: false,
	},
} satisfies ClosePayload;

describe("presentProgress", () => {
	it("arma la racha, los meses y la siguiente recompensa", () => {
		const model = presentProgress(overview, rewards, savings, null);

		expect(model.empty).toBe(false);
		expect(model.streakLabel).toBe("3");
		expect(model.sinceLabel).toBe("DESDE MAY");
		expect(model.bars.map((bar) => bar.monthLabel)).toEqual(["MAY", "SEP"]);
		expect(model.bars.map((bar) => bar.tone)).toEqual(["compliant", "warning"]);
		expect(model.savedLabel).toBe("S/ 4,320");
		expect(model.achievements).toEqual([
			{ key: "first_cycle_closed", title: "Primer ciclo cerrado", done: true, detail: "MAY" },
			{
				key: "emergency_fund_25",
				title: "Fondo al 25%",
				done: false,
				detail: "Te falta S/ 200 para el 25%",
			},
		]);
		expect(model.rewardText).toBe(
			"Faltan 3 ciclos para Acento Arcilla. Paleta alterna · desbloqueado con 6 ciclos",
		);
		expect(model.closeEntry).toBeNull();
		expect(JSON.stringify(model)).not.toContain("Quipu Plus");
	});

	it("queda vacío sin racha ni ciclos, y omite DESDE", () => {
		const model = presentProgress(
			{
				...overview,
				currentStreak: 0,
				chartBars: [{ id: -1, status: "empty", heightPx: 0 }],
				achievements: [],
			} satisfies Overview,
			{
				...rewards,
				rewards: rewards.rewards.map((reward) => ({ ...reward, unlocked: true })),
			} satisfies Rewards,
			null,
			null,
		);

		expect(model.empty).toBe(true);
		expect(model.sinceLabel).toBeNull();
		expect(model.bars).toEqual([]);
		expect(model.savedLabel).toBeNull();
		expect(model.rewardText).toBeNull();
	});

	it("muestra el cierre solo cuando el query trae reporte", () => {
		expect(presentProgress(overview, rewards, savings, null).closeEntry).toBeNull();
		expect(presentProgress(overview, rewards, savings, closeReport).closeEntry).toEqual({
			label: "CICLO CERRADO · JULIO",
			highlighted: true,
		});
	});
});

describe("presentClose", () => {
	it("calcula el sobrante y omite desvíos y la acción sin origen", () => {
		const model = presentClose(closeReport, savings);

		expect(model?.title).toBe("Cerraste julio con S/ 210 de sobra.");
		expect(model?.subtitle).toBe("3 ciclos seguidos en verde.");
		expect(model?.spentLabel).toBe("GASTADO S/ 3,290");
		expect(model?.surplusLabel).toBe("SOBRÓ S/ 210");
		expect(model?.rows.map((row) => row.amountLabel)).toEqual(["S/ 2,000", "S/ 1,000", "S/ 290"]);
		expect(model?.segments.map((segment) => segment.percent)).toEqual([57, 29, 8, 6]);
		expect(model?.showMove).toBe(false);
		expect(JSON.stringify(model)).not.toContain("%");
		expect(JSON.stringify(model)).not.toContain("cycle-1");
	});

	it("titula sin cifra cuando no sobra", () => {
		const model = presentClose(
			{
				...closeReport,
				report: {
					...closeReport.report,
					totalIncomeCents: 329000,
				},
			} satisfies ClosePayload,
			savings,
		);

		expect(model?.title).toBe("Cerraste julio.");
		expect(model?.surplusLabel).toBeNull();
		expect(model?.showMove).toBe(false);
	});

	it("devuelve null sin reporte", () => {
		expect(presentClose(null, savings)).toBeNull();
	});
});
