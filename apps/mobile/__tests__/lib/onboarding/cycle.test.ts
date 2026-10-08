import {
	currentMonthLabel,
	cycleDaysForModel,
	cyclePreview,
	paydayText,
} from "@/shared/lib/onboarding/cycle";

describe("paydayText", () => {
	it("mensual", () => {
		expect(paydayText("monthly")).toBe("El 1 de cada mes");
	});

	it("quincenal", () => {
		expect(paydayText("biweekly")).toBe("El 15 y 30 de cada mes");
	});

	it("semanal usa días del ciclo", () => {
		expect(paydayText("weekly")).toBe("Cada 7 días");
	});
});

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

describe("cycleDaysForModel", () => {
	it("fijo usa los días de la frecuencia", () => {
		expect(cycleDaysForModel({ incomeModel: "fixed", payFrequency: "biweekly" })).toBe(15);
	});

	it("variable usa la duración elegida", () => {
		expect(cycleDaysForModel({ incomeModel: "variable", cycleDurationDays: 15 })).toBe(15);
	});

	it("variable sin duración cae a 30", () => {
		expect(cycleDaysForModel({ incomeModel: "variable" })).toBe(30);
	});

	it("mixto usa los días de la frecuencia", () => {
		expect(cycleDaysForModel({ incomeModel: "mixed", payFrequency: "monthly" })).toBe(30);
	});

	it("sin frecuencia cae a 30", () => {
		expect(cycleDaysForModel({ incomeModel: "fixed" })).toBe(30);
	});
});

describe("currentMonthLabel", () => {
	it("devuelve el mes actual capitalizado", () => {
		const months = [
			"Enero",
			"Febrero",
			"Marzo",
			"Abril",
			"Mayo",
			"Junio",
			"Julio",
			"Agosto",
			"Septiembre",
			"Octubre",
			"Noviembre",
			"Diciembre",
		];
		expect(months).toContain(currentMonthLabel());
	});
});
