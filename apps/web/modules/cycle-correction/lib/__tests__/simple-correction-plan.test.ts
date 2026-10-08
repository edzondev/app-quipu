import { describe, expect, it } from "vitest";
import { buildSimpleCorrectionPlan, proposeRemainingByEnvelope } from "../simple-correction-plan";

const ALLOCATION = { needs: 50, wants: 30, savings: 20 };

describe("proposeRemainingByEnvelope", () => {
	it("reparte el libre según los porcentajes", () => {
		expect(
			proposeRemainingByEnvelope({
				freeCents: 130_000,
				allocation: ALLOCATION,
				spentPerEnvelope: { needs: 0, wants: 0, savings: 0 },
			}),
		).toEqual({ needs: 65_000, wants: 39_000, savings: 26_000 });
	});

	it("resta lo ya gastado y no baja de 0", () => {
		expect(
			proposeRemainingByEnvelope({
				freeCents: 130_000,
				allocation: ALLOCATION,
				spentPerEnvelope: { needs: 70_000, wants: 10_000, savings: 0 },
			}),
		).toEqual({ needs: 0, wants: 29_000, savings: 26_000 });
	});

	it("con libre 0 todo queda en 0", () => {
		expect(
			proposeRemainingByEnvelope({
				freeCents: 0,
				allocation: ALLOCATION,
				spentPerEnvelope: { needs: 0, wants: 0, savings: 0 },
			}),
		).toEqual({ needs: 0, wants: 0, savings: 0 });
	});
});

describe("buildSimpleCorrectionPlan", () => {
	const base = {
		incomeCents: 380_000,
		allocation: ALLOCATION,
		spentPerEnvelope: { needs: 0, wants: 0, savings: 0 },
		targets: { needs: 65_000, wants: 39_000, savings: 26_000 },
	};

	it("reserva a compromiso y deja el resto sin asignar en 0", () => {
		const result = buildSimpleCorrectionPlan({
			...base,
			reservedWithCommitmentCents: 250_000,
			reservedGenericCents: 0,
			commitmentId: "c1",
		});
		expect(result.reserveToCommitments).toEqual([{ commitmentId: "c1", amountCents: 250_000 }]);
		expect(result.remainingByEnvelope).toEqual(base.targets);
		expect(result.unallocatedCents).toBe(0);
		expect(result.declaredLiquidCents).toBe(380_000);
	});

	it("apartar sin compromiso va a por repartir", () => {
		const result = buildSimpleCorrectionPlan({
			...base,
			reservedWithCommitmentCents: 0,
			reservedGenericCents: 250_000,
			commitmentId: null,
		});
		expect(result.reserveToCommitments).toEqual([]);
		expect(result.unallocatedCents).toBe(250_000);
		expect(result.declaredLiquidCents).toBe(380_000);
	});

	it("el sobrante no va a por repartir; se concilia via declarado", () => {
		const result = buildSimpleCorrectionPlan({
			...base,
			reservedWithCommitmentCents: 250_000,
			reservedGenericCents: 0,
			commitmentId: "c1",
			targets: { needs: 50_000, wants: 30_000, savings: 20_000 },
		});
		expect(result.unallocatedCents).toBe(0);
		expect(result.declaredLiquidCents).toBe(350_000);
	});

	it("con gasto previo, el declarado refleja el liquido real del ciclo", () => {
		const spentPerEnvelope = { needs: 51_000, wants: 0, savings: 0 };
		const targets = proposeRemainingByEnvelope({
			freeCents: 130_000,
			allocation: ALLOCATION,
			spentPerEnvelope,
		});
		const result = buildSimpleCorrectionPlan({
			...base,
			spentPerEnvelope,
			targets,
			reservedWithCommitmentCents: 250_000,
			reservedGenericCents: 0,
			commitmentId: "c1",
		});
		expect(targets).toEqual({
			needs: 14_000,
			wants: 39_000,
			savings: 26_000,
		});
		expect(result.unallocatedCents).toBe(0);
		expect(result.declaredLiquidCents).toBe(329_000);
	});

	it("lanza si los objetivos superan el libre", () => {
		expect(() =>
			buildSimpleCorrectionPlan({
				...base,
				reservedWithCommitmentCents: 250_000,
				reservedGenericCents: 0,
				commitmentId: "c1",
				targets: { needs: 200_000, wants: 0, savings: 0 },
			}),
		).toThrow("Los sobres no pueden superar el dinero libre");
	});

	it("lanza si hay reserva a compromiso sin commitmentId", () => {
		expect(() =>
			buildSimpleCorrectionPlan({
				...base,
				reservedWithCommitmentCents: 250_000,
				reservedGenericCents: 0,
				commitmentId: null,
			}),
		).toThrow("Elige o crea el compromiso para tu reserva");
	});

	it("lanza si reservado supera el ingreso", () => {
		expect(() =>
			buildSimpleCorrectionPlan({
				...base,
				reservedWithCommitmentCents: 400_000,
				reservedGenericCents: 0,
				commitmentId: "c1",
			}),
		).toThrow("Lo apartado no puede superar lo ingresado");
	});

	it("lanza si apartado + sobres superan el ingreso menos lo gastado", () => {
		expect(() =>
			buildSimpleCorrectionPlan({
				...base,
				incomeCents: 130_000,
				spentPerEnvelope: { needs: 79_000, wants: 0, savings: 0 },
				reservedWithCommitmentCents: 0,
				reservedGenericCents: 50_000,
				commitmentId: null,
				targets: { needs: 19_000, wants: 0, savings: 0 },
			}),
		).toThrow("Repartes más dinero del que realmente tienes disponible");
	});

	it("acepta cuando apartado + sobres igualan el disponible real", () => {
		const result = buildSimpleCorrectionPlan({
			...base,
			incomeCents: 130_000,
			spentPerEnvelope: { needs: 79_000, wants: 0, savings: 0 },
			reservedWithCommitmentCents: 0,
			reservedGenericCents: 50_000,
			commitmentId: null,
			targets: { needs: 1_000, wants: 0, savings: 0 },
		});
		expect(result.declaredLiquidCents).toBe(51_000);
	});
});
