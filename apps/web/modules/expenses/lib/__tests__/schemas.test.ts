import { describe, expect, it } from "vitest";
import { KEYPAD_MAX_CENTS } from "@/modules/expenses/lib/keypad";
import { createExpenseRegisterSchema, expenseRegisterSchema } from "@/modules/expenses/schemas";

function validBase() {
	return {
		amountCents: 2_500,
		envelopeType: "wants" as const,
		description: "",
	};
}

describe("createExpenseRegisterSchema", () => {
	const schema = createExpenseRegisterSchema();

	it("accepts a valid payload", () => {
		expect(schema.safeParse(validBase()).success).toBe(true);
	});

	it("rejects zero amount", () => {
		expect(schema.safeParse({ ...validBase(), amountCents: 0 }).success).toBe(false);
	});

	it("rejects amount above keypad max", () => {
		expect(schema.safeParse({ ...validBase(), amountCents: KEYPAD_MAX_CENTS + 1 }).success).toBe(
			false,
		);
	});

	it("rejects invalid envelope", () => {
		expect(schema.safeParse({ ...validBase(), envelopeType: "savings" }).success).toBe(false);
	});

	it("rejects description over 120 chars", () => {
		expect(schema.safeParse({ ...validBase(), description: "x".repeat(121) }).success).toBe(false);
	});
});

describe("expenseRegisterSchema export", () => {
	it("parses valid base", () => {
		expect(expenseRegisterSchema.safeParse(validBase()).success).toBe(true);
	});
});
