import { formatSoles } from "@/shared/lib/onboarding/daily";

describe("formatSoles", () => {
	it("símbolo por defecto", () => {
		expect(formatSoles(350000)).toBe("S/ 3,500");
	});

	it("monto grande sin céntimos", () => {
		expect(formatSoles(96100)).toBe("S/ 961");
	});

	it("con céntimos usa 2 decimales", () => {
		expect(formatSoles(350050)).toBe("S/ 3,500.50");
	});

	it("símbolo personalizado", () => {
		expect(formatSoles(1000, "$")).toBe("$ 10");
	});
});
