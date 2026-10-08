import { describe, expect, it } from "vitest";
import { KEYPAD_MAX_CENTS } from "@/modules/expenses/lib/keypad";
import {
	addCommitmentFormSchema,
	parseAmountInputToCents,
	toCreateFixedCommitmentPayload,
} from "@/shared/components/commitments/schemas";

function validBase() {
	return {
		name: "Alquiler",
		amountInput: "1200.50",
		dueDayInput: "5",
		envelope: "needs" as const,
	};
}

describe("parseAmountInputToCents", () => {
	it("parses decimal soles to cents", () => {
		expect(parseAmountInputToCents("1200.50")).toBe(120_050);
	});

	it("returns null for invalid input", () => {
		expect(parseAmountInputToCents("")).toBe(null);
		expect(parseAmountInputToCents("abc")).toBe(null);
	});
});

describe("addCommitmentFormSchema", () => {
	it("accepts valid payload", () => {
		expect(addCommitmentFormSchema.safeParse(validBase()).success).toBe(true);
	});

	it("rejects empty name", () => {
		expect(addCommitmentFormSchema.safeParse({ ...validBase(), name: "   " }).success).toBe(false);
	});

	it("rejects name over 40 chars", () => {
		expect(
			addCommitmentFormSchema.safeParse({
				...validBase(),
				name: "x".repeat(41),
			}).success,
		).toBe(false);
	});

	it("rejects invalid amount", () => {
		expect(addCommitmentFormSchema.safeParse({ ...validBase(), amountInput: "0" }).success).toBe(
			false,
		);
	});

	it("rejects amount above keypad max in cents", () => {
		const soles = (KEYPAD_MAX_CENTS + 1) / 100;
		expect(
			addCommitmentFormSchema.safeParse({
				...validBase(),
				amountInput: String(soles),
			}).success,
		).toBe(false);
	});

	it("rejects due day out of range", () => {
		expect(addCommitmentFormSchema.safeParse({ ...validBase(), dueDayInput: "32" }).success).toBe(
			false,
		);
	});

	it("rejects invalid envelope", () => {
		expect(addCommitmentFormSchema.safeParse({ ...validBase(), envelope: "savings" }).success).toBe(
			false,
		);
	});
});

describe("toCreateFixedCommitmentPayload", () => {
	it("maps validated form values to mutation args", () => {
		expect(toCreateFixedCommitmentPayload(validBase())).toEqual({
			name: "Alquiler",
			amount: 120_050,
			envelope: "needs",
			dueDay: 5,
		});
	});
});
