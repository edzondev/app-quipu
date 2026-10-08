import { describe, expect, it } from "vitest";
import { extractConcept, hasCustomConcept } from "../incomeEditUtils";

describe("extractConcept", () => {
	it("returns empty string when description matches source label", () => {
		expect(extractConcept("Sueldo", "payroll")).toBe("");
		expect(extractConcept("Proyecto", "freelance")).toBe("");
		expect(extractConcept("Negocio", "business")).toBe("");
		expect(extractConcept("Regalo", "gift")).toBe("");
		expect(extractConcept("Devolución", "refund")).toBe("");
		expect(extractConcept("Inversión", "investment")).toBe("");
		expect(extractConcept("Otro", "other")).toBe("");
	});

	it("returns the description when it differs from the source label", () => {
		expect(extractConcept("pago cliente enero", "payroll")).toBe("pago cliente enero");
		expect(extractConcept("diseño logo", "freelance")).toBe("diseño logo");
		expect(extractConcept("venta de muebles", "other")).toBe("venta de muebles");
	});

	it("is case-sensitive (labels are fixed in Spanish)", () => {
		// "sueldo" (lowercase) is NOT the source label "Sueldo" (title case).
		expect(extractConcept("sueldo", "payroll")).toBe("sueldo");
	});

	it("returns description unchanged for an extraordinary-style description", () => {
		expect(extractConcept("Gratificación de julio", "payroll")).toBe("Gratificación de julio");
	});
});

describe("hasCustomConcept", () => {
	it("returns false when description is the source label", () => {
		expect(hasCustomConcept("Sueldo", "payroll")).toBe(false);
		expect(hasCustomConcept("Proyecto", "freelance")).toBe(false);
	});

	it("returns true when description differs from the source label", () => {
		expect(hasCustomConcept("pago de cliente", "payroll")).toBe(true);
		expect(hasCustomConcept("asesoría legal", "freelance")).toBe(true);
	});
});
