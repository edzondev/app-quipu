import { fixtureId } from "@/__fixtures__/convex-id";
import {
	ahorroPlanRow,
	emptyAhorro,
	GOAL_WITHOUT_AUTO_CONTRIBUTION,
	type MoveSurplusContext,
	presentAhorro,
	type SavingsOverview,
	savingsBarPercent,
	toCreateSavingsGoal,
} from "@/shared/lib/savings/model";

type Overview = NonNullable<SavingsOverview>;
type Fund = NonNullable<Overview["emergencyFund"]>;
type Surplus = NonNullable<MoveSurplusContext>;

const fund = {
	id: fixtureId("subEnvelopes", "fund-1"),
	label: "Fondo de emergencia",
	currentAmount: 185000,
	targetAmount: 450000,
	monthlyEssentialsCents: 150000,
	monthsCovered: 1.233,
	monthsCoveredCopy: "1.2 de 3 meses cubiertos · vas seguro",
	progressPercent: 41,
	cycleContributionCents: 50000,
	cyclesToComplete: 6,
	contributionStreak: 0,
	availableToContributeCents: 0,
} satisfies Fund;

const overview = {
	profile: { name: "Ana", currencyCode: "PEN" },
	hasActiveCycle: true,
	totalSavedCents: 305000,
	cycleContributionCents: 70000,
	emergencyFund: fund,
	goals: [
		{
			id: fixtureId("subEnvelopes", "goal-viaje"),
			label: "Viaje",
			currentAmount: 120000,
			targetAmount: 200000,
			progressPercent: 60,
			isSystemDefault: false,
		},
	],
	canCreateGoal: true,
	assignPlan: null,
} satisfies Overview;

const extraIncome = {
	currencyCode: "PEN",
	sources: {
		needs: { availableCents: 1000 },
		wants: { availableCents: 5000 },
		extraordinary: { availableCents: 9600 },
	},
	destinations: [
		{
			id: fixtureId("subEnvelopes", "fund-1"),
			label: "Fondo de emergencia",
			isSystemDefault: true,
		},
	],
} satisfies Surplus;

describe("savingsBarPercent", () => {
	it("va de 0 a la meta y no pasa de 100", () => {
		expect(savingsBarPercent(0, 100)).toBe(0);
		expect(savingsBarPercent(50, 100)).toBe(50);
		expect(savingsBarPercent(150, 100)).toBe(100);
		expect(savingsBarPercent(-10, 100)).toBe(0);
		expect(savingsBarPercent(10, 0)).toBe(0);
		expect(savingsBarPercent(10, -5)).toBe(0);
		expect(savingsBarPercent(Number.NaN, 100)).toBe(0);
		expect(savingsBarPercent(10, Number.POSITIVE_INFINITY)).toBe(0);
	});
});

describe("presentAhorro", () => {
	it("arma el fondo, el total y el subtítulo con lo que devuelve Convex", () => {
		const model = presentAhorro(overview, null);

		expect(model.totalLabel).toBe("S/ 3,050");
		expect(model.totalMuted).toBe(false);
		expect(model.cycleSubtitle).toBe("Guardas S/ 700 cada ciclo. Con calma, se nota.");
		expect(model.fund).toMatchObject({
			pending: false,
			label: "Fondo de emergencia",
			symbol: "S/",
			amountBody: "1,850",
			targetLine: "de S/ 4,500 · meta de 3 meses de gastos",
			monthsLine: "1.2 DE 3 MESES CUBIERTOS",
			cycleLine: "+S/ 500 / CICLO",
			percent: 41,
		});
	});

	it("deja la meta sin aporte automático y sin barra si no hay meta", () => {
		const model = presentAhorro(overview, null);

		expect(model.goals).toEqual([
			{
				id: fixtureId("subEnvelopes", "goal-viaje"),
				name: "Viaje",
				currentLabel: "S/ 1,200",
				targetLabel: "de 2,000",
				percent: 60,
				footer: GOAL_WITHOUT_AUTO_CONTRIBUTION,
			},
		]);
		expect(JSON.stringify(model.goals)).not.toContain("ACTIVAR");

		const openGoal = {
			...overview,
			goals: [
				{
					id: fixtureId("subEnvelopes", "goal-abierta"),
					label: "Laptop",
					currentAmount: 0,
					targetAmount: undefined,
					progressPercent: 0,
					isSystemDefault: false,
				},
			],
		} satisfies Overview;
		expect(presentAhorro(openGoal, null).goals[0]?.percent).toBeNull();
	});

	it("usa el texto de meses de Convex cuando no hay gasto mensual", () => {
		const model = presentAhorro(
			{
				...overview,
				emergencyFund: {
					...fund,
					monthlyEssentialsCents: 0,
					monthsCovered: 0,
					monthsCoveredCopy: "0 de 3 meses cubiertos · empieza con calma",
					cycleContributionCents: 0,
				},
			} satisfies Overview,
			null,
		);

		expect(model.fund.targetLine).toBe("de S/ 4,500");
		expect(model.fund.monthsLine).toBe("0 de 3 meses cubiertos · empieza con calma");
		expect(model.fund.cycleLine).toBeNull();
		expect(model.fund.percent).toBe(41);
	});

	it("muestra el banner solo con el ingreso extra", () => {
		const model = presentAhorro(overview, extraIncome);

		expect(model.surplus).toEqual({
			amountLabel: "S/ 96",
			args: { fromEnvelope: "extraordinary", amount: 9600, toSubEnvelopeId: "fund-1" },
		});
	});

	it("oculta el banner si el ingreso extra es 0 aunque needs y wants tengan saldo", () => {
		const withoutExtra = {
			...extraIncome,
			sources: {
				needs: { availableCents: 2500 },
				wants: { availableCents: 9600 },
				extraordinary: { availableCents: 0 },
			},
		} satisfies Surplus;

		expect(presentAhorro(overview, null).surplus).toBeNull();
		expect(presentAhorro(overview, withoutExtra).surplus).toBeNull();
	});

	it("deja el fondo pendiente cuando todavía no hay meta de meses", () => {
		expect(presentAhorro(null, null)).toEqual(emptyAhorro());

		const pending = {
			...overview,
			totalSavedCents: 0,
			cycleContributionCents: 0,
			emergencyFund: { ...fund, targetAmount: 0, currentAmount: 0 },
			goals: [],
			canCreateGoal: false,
		} satisfies Overview;
		const model = presentAhorro(pending, null);

		expect(model.totalMuted).toBe(true);
		expect(model.cycleSubtitle).toBe("Tu 20% empieza a acumularse con el primer ingreso.");
		expect(model.fund.pending).toBe(true);
		expect(model.fund.amountBody).toBe("0");
		expect(model.fund.targetLine).toBe(
			"Tu primera meta es cubrir 3 meses de gastos. Quipu la calcula cuando conozca tu ciclo.",
		);
		expect(model.goals).toEqual([]);
	});
});

describe("ahorroPlanRow", () => {
	it("pone el total a la derecha y no dice 0 metas activas", () => {
		expect(ahorroPlanRow(overview)).toEqual({
			subtitle: "Fondo + 1 meta activa",
			totalLabel: "S/ 3,050",
		});
		expect(
			ahorroPlanRow({
				...overview,
				goals: [
					...overview.goals,
					{
						id: fixtureId("subEnvelopes", "g2"),
						label: "Casa",
						currentAmount: 0,
						targetAmount: 100,
						progressPercent: 0,
						isSystemDefault: false,
					},
				],
			} satisfies Overview),
		).toEqual({
			subtitle: "Fondo + 2 metas activas",
			totalLabel: "S/ 3,050",
		});
		expect(ahorroPlanRow(null)).toBeNull();
		expect(
			ahorroPlanRow({
				...overview,
				goals: [],
			} satisfies Overview)?.subtitle,
		).toBe("Fondo de emergencia");
		expect(
			ahorroPlanRow({
				...overview,
				emergencyFund: null,
				goals: [],
			} satisfies Overview)?.subtitle,
		).toBeNull();
	});
});

describe("toCreateSavingsGoal", () => {
	it("exige nombre y deja la meta vacía como opcional", () => {
		expect(toCreateSavingsGoal({ label: "  ", targetRaw: "" })).toEqual({
			ok: false,
			fields: { label: "El nombre de la meta es obligatorio." },
		});
		expect(toCreateSavingsGoal({ label: "x".repeat(41), targetRaw: "" })).toEqual({
			ok: false,
			fields: { label: "El nombre de la meta debe tener como máximo 40 caracteres." },
		});
		expect(toCreateSavingsGoal({ label: "  Viaje  ", targetRaw: "  " })).toEqual({
			ok: true,
			args: { label: "Viaje" },
		});
	});

	it("rechaza un monto en cero y acepta céntimos", () => {
		expect(toCreateSavingsGoal({ label: "Viaje", targetRaw: "0" })).toEqual({
			ok: false,
			fields: { targetRaw: "La meta debe ser mayor a cero." },
		});
		expect(toCreateSavingsGoal({ label: "Viaje", targetRaw: "2000" })).toEqual({
			ok: true,
			args: { label: "Viaje", targetAmount: 200000 },
		});
	});
});
