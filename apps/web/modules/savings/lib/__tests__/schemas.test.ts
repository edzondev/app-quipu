import { describe, expect, it } from "vitest";
import { KEYPAD_MAX_CENTS } from "@/modules/expenses/lib/keypad";
import {
	createMoveSurplusFormSchema,
	createNewGoalSchema,
	moveSurplusFormToMutationArgs,
	moveSurplusInputSchema,
	newGoalFormToMutationArgs,
} from "@/modules/savings/schemas";

describe("createNewGoalSchema", () => {
	const schema = createNewGoalSchema();

	it("accepts label without target", () => {
		expect(schema.safeParse({ label: "Viaje", targetInput: "" }).success).toBe(true);
	});

	it("accepts label with valid target input", () => {
		expect(schema.safeParse({ label: "Viaje", targetInput: "3000" }).success).toBe(true);
	});

	it("rejects empty label", () => {
		expect(schema.safeParse({ label: "  ", targetInput: "" }).success).toBe(false);
	});

	it("rejects label over 40 chars", () => {
		expect(schema.safeParse({ label: "x".repeat(41), targetInput: "" }).success).toBe(false);
	});

	it("rejects unparseable target when provided", () => {
		expect(schema.safeParse({ label: "Viaje", targetInput: "abc" }).success).toBe(false);
	});

	it("rejects target above keypad max", () => {
		const overMax = String(KEYPAD_MAX_CENTS / 100 + 1);
		expect(schema.safeParse({ label: "Viaje", targetInput: overMax }).success).toBe(false);
	});
});

describe("newGoalFormToMutationArgs", () => {
	it("maps empty target to undefined", () => {
		expect(newGoalFormToMutationArgs({ label: "Viaje", targetInput: "" })).toEqual({
			label: "Viaje",
			targetAmount: undefined,
		});
	});

	it("maps soles input to cents", () => {
		expect(newGoalFormToMutationArgs({ label: "Viaje", targetInput: "3000" })).toEqual({
			label: "Viaje",
			targetAmount: 300_000,
		});
	});
});

describe("moveSurplusInputSchema", () => {
	it("accepts valid move surplus payload", () => {
		expect(
			moveSurplusInputSchema.safeParse({
				fromEnvelope: "wants",
				amount: 5_000,
				toSubEnvelopeId: "sub123",
			}).success,
		).toBe(true);
	});

	it("accepts extraordinary fromEnvelope", () => {
		expect(
			moveSurplusInputSchema.safeParse({
				fromEnvelope: "extraordinary",
				amount: 10_000,
			}).success,
		).toBe(true);
	});

	it("rejects zero amount", () => {
		expect(
			moveSurplusInputSchema.safeParse({
				fromEnvelope: "needs",
				amount: 0,
				toSubEnvelopeId: "sub123",
			}).success,
		).toBe(false);
	});
});

describe("createMoveSurplusFormSchema", () => {
	const schema = createMoveSurplusFormSchema({
		needs: 50_000,
		wants: 80_000,
		extraordinary: 20_000,
	});

	it("rejects amount above selected source", () => {
		expect(
			schema.safeParse({
				fromSource: "wants",
				amountCents: 90_000,
				destinationId: "sub1",
			}).success,
		).toBe(false);
	});

	it("maps to mutation args", () => {
		expect(
			moveSurplusFormToMutationArgs({
				fromSource: "extraordinary",
				amountCents: 10_000,
				destinationId: "sub1",
			}),
		).toEqual({
			fromEnvelope: "extraordinary",
			amount: 10_000,
			toSubEnvelopeId: "sub1",
		});
	});
});
