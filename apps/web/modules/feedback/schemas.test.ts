import { describe, expect, it } from "vitest";
import { submitFeedbackInputSchema } from "./schemas";

describe("submitFeedbackInputSchema", () => {
	it("accepts valid feedback input", () => {
		const parsed = submitFeedbackInputSchema.parse({
			category: "improvement",
			message: "Me gustaría ver un resumen semanal más corto.",
			pagePath: "/settings/feedback",
		});

		expect(parsed.category).toBe("improvement");
		expect(parsed.message).toBe("Me gustaría ver un resumen semanal más corto.");
	});

	it("rejects short messages", () => {
		const result = submitFeedbackInputSchema.safeParse({
			category: "problem",
			message: "corto",
		});

		expect(result.success).toBe(false);
	});

	it("rejects overly long page paths", () => {
		const result = submitFeedbackInputSchema.safeParse({
			category: "question",
			message: "Tengo una consulta sobre mi ciclo activo.",
			pagePath: "x".repeat(201),
		});

		expect(result.success).toBe(false);
	});
});
