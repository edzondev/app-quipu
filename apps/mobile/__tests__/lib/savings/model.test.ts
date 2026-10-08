import {
	ahorroPlanSubtitle,
	emptyAhorro,
	GOAL_WITHOUT_AUTO_CONTRIBUTION,
	presentAhorro,
	savingsBarPercent,
	toCreateSavingsGoal,
} from "@/shared/lib/savings/model";

const fund = {
	label: "Fondo de emergencia",
	currentAmount: 185000,
	targetAmount: 450000,
	monthlyEssentialsCents: 150000,
	monthsCovered: 1.233,
	monthsCoveredCopy: "1.2 de 3 meses cubiertos · vas seguro",
	cycleContributionCents: 50000,
};

const overview = {
	profile: { currencyCode: "PEN" },
	hasActiveCycle: true,
	totalSavedCents: 305000,
	cycleContributionCents: 70000,
	emergencyFund: fund,
	goals: [
		{
			id: "goal-viaje",
			label: "Viaje",
			currentAmount: 120000,
			targetAmount: 200000,
			isSystemDefault: false,
		},
	],
	canCreateGoal: true,
};

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
		const model = presentAhorro(overview, { emergencyFund: fund }, null);

		expect(model.totalLabel).toBe("S/ 3,050");
		expect(model.cycleSubtitle).toBe("Guardas S/ 700 cada ciclo. Con calma, se nota.");
		expect(model.fund).toMatchObject({
			label: "Fondo de emergencia",
			amountLabel: "S/ 1,850",
			targetLine: "de S/ 4,500 · meta de 3 meses de gastos",
			monthsLine: "1.2 DE 3 MESES CUBIERTOS",
			cycleLine: "+S/ 500 / CICLO",
			percent: 41,
		});
		expect(model.empty).toBe(false);
	});

	it("deja la meta sin aporte automático y sin ACTIVAR", () => {
		const model = presentAhorro(overview, null, null);

		expect(model.goals).toEqual([
			{
				id: "goal-viaje",
				name: "Viaje",
				amountLine: "S/ 1,200 de 2,000",
				percent: 60,
				footer: GOAL_WITHOUT_AUTO_CONTRIBUTION,
			},
		]);
		expect(JSON.stringify(model.goals)).not.toContain("ACTIVAR");
		expect(JSON.stringify(model.goals)).not.toContain("LISTA EN");
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
			},
			null,
			null,
		);

		expect(model.fund?.targetLine).toBe("de S/ 4,500");
		expect(model.fund?.monthsLine).toBe("0 de 3 meses cubiertos · empieza con calma");
		expect(model.fund?.cycleLine).toBeNull();
		expect(model.fund?.percent).toBe(41);
	});

	it("muestra el banner solo con el ingreso extra", () => {
		const model = presentAhorro(overview, null, {
			currencyCode: "PEN",
			sources: {
				needs: { availableCents: 1000 },
				wants: { availableCents: 5000 },
				extraordinary: { availableCents: 9600 },
			},
			destinations: [{ id: "fund-1", label: "Fondo de emergencia", isSystemDefault: true }],
		});

		expect(model.surplus).toEqual({
			amountLabel: "S/ 96",
			args: { fromEnvelope: "extraordinary", amount: 9600, toSubEnvelopeId: "fund-1" },
		});
	});

	it("oculta el banner si el ingreso extra es 0 aunque needs y wants tengan saldo", () => {
		expect(presentAhorro(overview, null, null).surplus).toBeNull();
		expect(
			presentAhorro(overview, null, {
				sources: {
					needs: { availableCents: 2500 },
					wants: { availableCents: 9600 },
					extraordinary: { availableCents: 0 },
				},
				destinations: [],
			}).surplus,
		).toBeNull();
	});

	it("queda vacío sin fondo ni metas", () => {
		expect(presentAhorro(null, null, null)).toEqual(emptyAhorro());
		const model = presentAhorro(
			{
				profile: { currencyCode: "PEN" },
				totalSavedCents: 0,
				cycleContributionCents: 0,
				emergencyFund: null,
				goals: [],
				canCreateGoal: false,
			},
			null,
			null,
		);
		expect(model.empty).toBe(true);
		expect(model.cycleSubtitle).toBe("Con calma, se nota.");
		expect(model.canCreateGoal).toBe(false);
	});
});

describe("ahorroPlanSubtitle", () => {
	it("cuenta el fondo y las metas activas", () => {
		expect(ahorroPlanSubtitle(overview)).toBe("Fondo + 1 meta activa");
		expect(
			ahorroPlanSubtitle({
				...overview,
				goals: [...overview.goals, { id: "g2", label: "Casa" }],
			}),
		).toBe("Fondo + 2 metas activas");
		expect(ahorroPlanSubtitle(null)).toBeNull();
		expect(
			ahorroPlanSubtitle({
				emergencyFund: null,
				goals: [],
			}),
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
