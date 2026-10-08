import { describe, expect, it } from "vitest";
import { simpleCorrectionWizardSchema } from "../simple-correction-schema";

const valid = {
	incomeCents: 380_000,
	reservedMode: "existing" as const,
	reservedCents: 250_000,
	commitmentId: "c1",
	newCommitment: undefined,
	targets: { needs: 65_000, wants: 39_000, savings: 26_000 },
};

describe("simpleCorrectionWizardSchema", () => {
	it("acepta un wizard completo", () => {
		expect(simpleCorrectionWizardSchema.safeParse(valid).success).toBe(true);
	});

	it("rechaza ingreso <= 0", () => {
		expect(simpleCorrectionWizardSchema.safeParse({ ...valid, incomeCents: 0 }).success).toBe(
			false,
		);
	});

	it("rechaza reservado mayor al ingreso", () => {
		expect(
			simpleCorrectionWizardSchema.safeParse({
				...valid,
				reservedCents: 400_000,
			}).success,
		).toBe(false);
	});

	it("exige compromiso si el modo es existing", () => {
		expect(simpleCorrectionWizardSchema.safeParse({ ...valid, commitmentId: "" }).success).toBe(
			false,
		);
	});

	it("exige datos del nuevo compromiso si el modo es create", () => {
		expect(
			simpleCorrectionWizardSchema.safeParse({
				...valid,
				reservedMode: "create",
				commitmentId: undefined,
				newCommitment: undefined,
			}).success,
		).toBe(false);
		expect(
			simpleCorrectionWizardSchema.safeParse({
				...valid,
				reservedMode: "create",
				commitmentId: undefined,
				newCommitment: {
					name: "Cuota auto",
					amountCents: 250_000,
					dueDay: 15,
					envelope: "needs" as const,
				},
			}).success,
		).toBe(true);
	});

	it("dueDay fuera de rango da mensaje en español", () => {
		const result = simpleCorrectionWizardSchema.safeParse({
			...valid,
			reservedMode: "create",
			commitmentId: undefined,
			newCommitment: {
				name: "Cuota auto",
				amountCents: 250_000,
				dueDay: 40,
				envelope: "needs" as const,
			},
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues[0]?.message).toContain("día de pago");
		}
	});

	it("acepta modo none con monto 0", () => {
		expect(
			simpleCorrectionWizardSchema.safeParse({
				...valid,
				reservedMode: "none" as const,
				reservedCents: 0,
				commitmentId: undefined,
			}).success,
		).toBe(true);
	});

	it("exige monto mayor a 0 si el modo no es none", () => {
		const result = simpleCorrectionWizardSchema.safeParse({
			...valid,
			reservedCents: 0,
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues[0]?.message).toBe("Pon el monto que vas a apartar.");
		}
	});

	it("rechaza targets negativos o no enteros", () => {
		expect(
			simpleCorrectionWizardSchema.safeParse({
				...valid,
				targets: { needs: -1, wants: 0, savings: 0 },
			}).success,
		).toBe(false);
	});
});
