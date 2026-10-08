import { describe, expect, it } from "vitest";
import { INCOME_MAX_CENTS } from "@/modules/income/constants";
import { createIncomeRegisterSchema } from "@/modules/income/schemas";
import { limaStartOfDay } from "@/shared/lib/date";

const NOW = new Date("2026-07-21T18:00:00.000Z").getTime();

function validBase() {
	return {
		incomeKind: "habitual" as const,
		amountCents: 150_00,
		source: "payroll" as const,
		concept: "",
		occurredAt: limaStartOfDay(NOW),
	};
}

describe("createIncomeRegisterSchema", () => {
	const schema = createIncomeRegisterSchema(NOW);

	it("accepts a valid payload", () => {
		expect(schema.safeParse(validBase()).success).toBe(true);
	});

	it("rejects zero amount", () => {
		expect(schema.safeParse({ ...validBase(), amountCents: 0 }).success).toBe(false);
	});

	it("rejects amount above income max", () => {
		expect(schema.safeParse({ ...validBase(), amountCents: INCOME_MAX_CENTS + 1 }).success).toBe(
			false,
		);
	});

	it("rejects future occurredAt", () => {
		expect(
			schema.safeParse({
				...validBase(),
				occurredAt: limaStartOfDay(NOW) + 86_400_000,
			}).success,
		).toBe(false);
	});

	it("rejects concept over 120 chars", () => {
		expect(schema.safeParse({ ...validBase(), concept: "x".repeat(121) }).success).toBe(false);
	});

	it("rejects invalid source", () => {
		expect(schema.safeParse({ ...validBase(), source: "salary" }).success).toBe(false);
	});
});
