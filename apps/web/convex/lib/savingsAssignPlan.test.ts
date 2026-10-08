import { describe, expect, it } from "vitest";
import { buildSavingsAssignPlan, validateSavingsAssignLines } from "./savingsAssignPlan";

const fund = {
	subEnvelopeId: "fund",
	label: "Fondo de emergencia",
	currentAmount: 50_000,
	targetAmount: 300_000,
};
const goalFar = {
	subEnvelopeId: "goal-a",
	label: "Casa",
	currentAmount: 0,
	targetAmount: 1_000_000,
};
const goalNear = {
	subEnvelopeId: "goal-b",
	label: "Viaje",
	currentAmount: 80_000,
	targetAmount: 100_000,
};
const goalOpen = {
	subEnvelopeId: "goal-c",
	label: "Libre",
	currentAmount: 0,
	targetAmount: 0,
};

describe("buildSavingsAssignPlan", () => {
	it("retorna null si no hay disponible", () => {
		expect(
			buildSavingsAssignPlan({
				availableCents: 0,
				emergencyFund: fund,
				goals: [goalNear],
			}),
		).toBeNull();
		expect(
			buildSavingsAssignPlan({
				availableCents: -5,
				emergencyFund: fund,
				goals: [],
			}),
		).toBeNull();
	});

	it("prioriza el Fondo incompleto y limita a lo que falta", () => {
		const plan = buildSavingsAssignPlan({
			availableCents: 400_000,
			emergencyFund: fund,
			goals: [goalNear],
		});
		expect(plan).not.toBeNull();
		expect(plan?.lines).toHaveLength(2);
		expect(plan?.lines[0]).toMatchObject({
			subEnvelopeId: "fund",
			suggestedCents: 380_000,
		});
		expect(plan?.lines[1]).toMatchObject({
			subEnvelopeId: "goal-b",
			suggestedCents: 20_000,
		});
		expect(plan?.totalCents).toBe(400_000);
		expect(plan?.rationale).toBe("fund_first");
	});

	it("reparte en cascada a la meta más cercana cuando el Fondo está completo", () => {
		const plan = buildSavingsAssignPlan({
			availableCents: 60_000,
			emergencyFund: { ...fund, currentAmount: 300_000 },
			goals: [goalFar, goalNear],
		});
		expect(plan?.lines[0]).toMatchObject({
			subEnvelopeId: "goal-b",
			suggestedCents: 20_000,
		});
		expect(plan?.lines[1]).toMatchObject({
			subEnvelopeId: "goal-a",
			suggestedCents: 40_000,
		});
		expect(plan?.rationale).toBe("complete_nearest_goal");
	});

	it("el sobrante sin destino va a la meta abierta (sin targetAmount)", () => {
		const plan = buildSavingsAssignPlan({
			availableCents: 30_000,
			emergencyFund: { ...fund, currentAmount: 300_000 },
			goals: [goalOpen],
		});
		expect(plan?.lines).toHaveLength(1);
		expect(plan?.lines[0]).toMatchObject({
			subEnvelopeId: "goal-c",
			suggestedCents: 30_000,
		});
	});

	it("sin metas, todo va al Fondo aunque rebase su objetivo", () => {
		const plan = buildSavingsAssignPlan({
			availableCents: 15_000,
			emergencyFund: { ...fund, currentAmount: 300_000 },
			goals: [],
		});
		expect(plan?.lines).toHaveLength(1);
		expect(plan?.lines[0]).toMatchObject({
			subEnvelopeId: "fund",
			suggestedCents: 15_000,
		});
		expect(plan?.rationale).toBe("fund_reinforce");
	});

	it("ignora metas ya completas y nunca excede el disponible", () => {
		const plan = buildSavingsAssignPlan({
			availableCents: 500_000,
			emergencyFund: { ...fund, currentAmount: 300_000 },
			goals: [{ ...goalNear, currentAmount: 100_000 }],
		});
		expect(plan?.lines).toHaveLength(1);
		expect(plan?.lines[0]?.subEnvelopeId).toBe("fund");
		expect(plan?.totalCents).toBe(500_000);
	});
});

describe("validateSavingsAssignLines", () => {
	it("normaliza y acepta líneas válidas", () => {
		const result = validateSavingsAssignLines(
			[
				{ subEnvelopeId: "fund", amount: 100 },
				{ subEnvelopeId: "goal-b", amount: 50 },
			],
			{ availableCents: 150, ownedIds: ["fund", "goal-b"] },
		);
		expect(result).toEqual([
			{ subEnvelopeId: "fund", amount: 100 },
			{ subEnvelopeId: "goal-b", amount: 50 },
		]);
	});

	it("rechaza montos no enteros, cero, negativos o vacíos", () => {
		expect(() =>
			validateSavingsAssignLines([], {
				availableCents: 100,
				ownedIds: ["fund"],
			}),
		).toThrow();
		expect(() =>
			validateSavingsAssignLines([{ subEnvelopeId: "fund", amount: 1.5 }], {
				availableCents: 100,
				ownedIds: ["fund"],
			}),
		).toThrow();
		expect(() =>
			validateSavingsAssignLines([{ subEnvelopeId: "fund", amount: 0 }], {
				availableCents: 100,
				ownedIds: ["fund"],
			}),
		).toThrow();
	});

	it("rechaza destino ajeno o duplicado", () => {
		expect(() =>
			validateSavingsAssignLines([{ subEnvelopeId: "other", amount: 10 }], {
				availableCents: 100,
				ownedIds: ["fund"],
			}),
		).toThrow();
		expect(() =>
			validateSavingsAssignLines(
				[
					{ subEnvelopeId: "fund", amount: 10 },
					{ subEnvelopeId: "fund", amount: 20 },
				],
				{ availableCents: 100, ownedIds: ["fund"] },
			),
		).toThrow();
	});

	it("rechaza total mayor al disponible", () => {
		expect(() =>
			validateSavingsAssignLines([{ subEnvelopeId: "fund", amount: 200 }], {
				availableCents: 100,
				ownedIds: ["fund"],
			}),
		).toThrow();
	});
});
