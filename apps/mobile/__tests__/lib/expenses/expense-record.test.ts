import { fixtureId } from "@/__fixtures__/convex-id";
import {
	lookupExpense,
	mapFrequentExpenses,
	readCreateDraft,
} from "@/shared/lib/expenses/expense-record";

const movements = {
	currencyCode: "PEN",
	cycle: { startDate: 1, endDate: 2 },
	movements: [
		{
			id: "exp1",
			kind: "expense" as const,
			label: "Plaza Vea",
			amount: 4200,
			timestamp: 1_700_000_000_000,
			envelopeType: "wants" as const,
			envelopeLabel: "Gustos",
		},
		{
			id: "exp2",
			kind: "expense" as const,
			label: "Fondo",
			amount: 1000,
			timestamp: 1_700_000_000_100,
			envelopeLabel: "Ahorro",
		},
	],
};

const recent = [
	{
		_id: fixtureId("expenses", "exp1"),
		amount: 4200,
		description: "Plaza Vea",
		timestamp: 1_700_000_000_000,
		envelopeId: fixtureId("envelopes", "env_wants"),
		envelopeType: "wants" as const,
	},
	{
		_id: fixtureId("expenses", "exp3"),
		amount: 500,
		description: "  Metropolitano ",
		timestamp: 1,
		envelopeId: fixtureId("envelopes", "env_needs"),
		envelopeType: "needs" as const,
	},
	{
		_id: fixtureId("expenses", "exp4"),
		amount: 800,
		description: "metropolitano",
		timestamp: 2,
		envelopeId: fixtureId("envelopes", "env_needs"),
		envelopeType: "needs" as const,
	},
];

describe("lookupExpense", () => {
	it("espera la consulta", () => {
		expect(lookupExpense(undefined, "exp1").status).toBe("loading");
	});

	it("arma el gasto editable desde el movimiento", () => {
		expect(lookupExpense(movements, "exp1")).toEqual({
			status: "ready",
			expense: {
				id: "exp1",
				amountCents: 4200,
				description: "Plaza Vea",
				envelopeType: "wants",
				timestamp: 1_700_000_000_000,
			},
		});
	});

	it("reconoce ahorro por la etiqueta", () => {
		const result = lookupExpense(movements, "exp2");
		expect(result.status).toBe("ready");
		if (result.status === "ready") {
			expect(result.expense.envelopeType).toBe("savings");
		}
	});

	it("no inventa un gasto que no está en el ciclo", () => {
		expect(lookupExpense(movements, "nope").status).toBe("missing");
	});
});

describe("mapFrequentExpenses", () => {
	it("deduplica por comercio y conserva el más reciente", () => {
		expect(mapFrequentExpenses(recent)).toEqual([
			{ id: "exp1", label: "Plaza Vea", amountCents: 4200 },
			{ id: "exp3", label: "Metropolitano", amountCents: 500 },
		]);
	});
});

describe("readCreateDraft", () => {
	it("lee el borrador que viaja en la ruta", () => {
		expect(
			readCreateDraft({
				amountRaw: "42.00",
				description: "Plaza Vea",
				envelopeType: "wants",
			}),
		).toEqual({
			amountRaw: "42.00",
			description: "Plaza Vea",
			envelopeType: "wants",
		});
		expect(
			readCreateDraft({
				amountRaw: "",
				description: "",
				envelopeType: "savings-no",
			}).envelopeType,
		).toBeNull();
	});
});
