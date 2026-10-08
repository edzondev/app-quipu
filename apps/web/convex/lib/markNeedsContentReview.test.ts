import { describe, expect, it } from "vitest";
import { scanTextsForContentFlags } from "./contentFlags";

describe("I8 content candidate gate", () => {
	it("detects suspicious income/expense text that should mark a candidate", () => {
		expect(scanTextsForContentFlags(["pago de extorsión"]).length).toBeGreaterThan(0);
	});

	it("ignores benign descriptions", () => {
		expect(scanTextsForContentFlags(["Mercado", "Sueldo Quincena"])).toEqual([]);
	});
});
