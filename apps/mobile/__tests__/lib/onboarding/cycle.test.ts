import { cyclePreview } from "@/shared/lib/onboarding/cycle";

describe("cyclePreview", () => {
	it("mensual", () => {
		expect(cyclePreview("monthly")).toBe("Ciclo: 1 – 30 de cada mes");
	});

	it("quincenal", () => {
		expect(cyclePreview("biweekly")).toBe("1 – 15 / 16 – 30 · 15 DÍAS");
	});

	it("semanal", () => {
		expect(cyclePreview("weekly")).toBe("7 DÍAS");
	});
});
