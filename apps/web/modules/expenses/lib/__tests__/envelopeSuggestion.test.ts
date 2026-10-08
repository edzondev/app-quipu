import { describe, expect, it } from "vitest";
import { extractRecentExpenseEnvelopes, suggestEnvelope } from "../envelopeSuggestion";

describe("envelope suggestion", () => {
	it("suggests wants for small amounts", () => {
		expect(suggestEnvelope(4800)).toEqual({
			envelopeType: "wants",
			hint: "Un café suele salir de aquí.",
		});
	});

	it("suggests needs for large amounts", () => {
		expect(suggestEnvelope(15_000)).toEqual({
			envelopeType: "needs",
			hint: "Gastos fijos suelen salir de aquí.",
		});
	});

	it("uses recent history for mid-range amounts", () => {
		expect(suggestEnvelope(7500, ["needs", "needs", "wants"])).toEqual({
			envelopeType: "needs",
			hint: "Coincide con tus gastos recientes.",
		});
	});

	it("defaults to wants when no history", () => {
		expect(suggestEnvelope(7500)).toEqual({
			envelopeType: "wants",
			hint: "Lo habitual es registrarlo en Gustos.",
		});
	});

	it("extracts envelope types from dashboard movements", () => {
		expect(
			extractRecentExpenseEnvelopes([
				{ kind: "income" },
				{ kind: "expense", envelopeLabel: "Gustos" },
				{ kind: "expense", envelopeLabel: "Necesidades" },
			]),
		).toEqual(["wants", "needs"]);
	});
});
