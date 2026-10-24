import { cyclePreview } from "@/shared/lib/onboarding/cycle";

describe("cyclePreview", () => {
	it("mensual", () => {
		expect(cyclePreview("monthly")).toBe("1 – 30 de cada mes · 30 DÍAS");
	});

	it("quincenal", () => {
		expect(cyclePreview("biweekly")).toBe("1 – 15 / 16 – 30 · 15 DÍAS");
	});

	it("semanal", () => {
		expect(cyclePreview("weekly")).toBe("7 DÍAS");
	});
});
