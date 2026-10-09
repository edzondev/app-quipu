import {
	ALLOCATION_DEFAULTS,
	ALLOCATION_STEP,
	allocationValue,
	maxAllocation,
	setEnvelopeAllocation,
	stepEnvelopeAllocation,
} from "@/shared/lib/onboarding/allocation";

function sum(state: {
	allocationNeeds: number;
	allocationWants: number;
	allocationSavings: number;
}) {
	return state.allocationNeeds + state.allocationWants + state.allocationSavings;
}

describe("setEnvelopeAllocation", () => {
	it("Necesidades a 60 deja Gustos quieto y Ahorro se queda con lo que sobra", () => {
		const result = setEnvelopeAllocation(ALLOCATION_DEFAULTS, "needs", 60);
		expect(result).toEqual({ allocationNeeds: 60, allocationWants: 30, allocationSavings: 10 });
	});

	it("lo que la persona ya fijó no se mueve al tocar el otro sobre", () => {
		const needs60 = setEnvelopeAllocation(ALLOCATION_DEFAULTS, "needs", 60);
		const wants20 = setEnvelopeAllocation(needs60, "wants", 20);
		expect(wants20).toEqual({ allocationNeeds: 60, allocationWants: 20, allocationSavings: 20 });
	});

	it("no deja pasar de lo que cabe: Ahorro nunca queda negativo", () => {
		const result = setEnvelopeAllocation(ALLOCATION_DEFAULTS, "needs", 100);
		expect(result).toEqual({ allocationNeeds: 70, allocationWants: 30, allocationSavings: 0 });
	});

	it("no baja de 0", () => {
		const result = setEnvelopeAllocation(ALLOCATION_DEFAULTS, "wants", -5);
		expect(result).toEqual({ allocationNeeds: 50, allocationWants: 0, allocationSavings: 50 });
	});

	it("redondea a entero y siempre suma 100", () => {
		const result = setEnvelopeAllocation(ALLOCATION_DEFAULTS, "needs", 60.65657567567766);
		expect(result.allocationNeeds).toBe(61);
		expect(sum(result)).toBe(100);
	});

	it("mismo valor es no-op (misma referencia)", () => {
		expect(setEnvelopeAllocation(ALLOCATION_DEFAULTS, "needs", 50)).toBe(ALLOCATION_DEFAULTS);
	});
});

describe("stepEnvelopeAllocation", () => {
	it(`sube y baja de a ${ALLOCATION_STEP} puntos`, () => {
		const up = stepEnvelopeAllocation(ALLOCATION_DEFAULTS, "needs", 1);
		expect(up).toEqual({ allocationNeeds: 55, allocationWants: 30, allocationSavings: 15 });
		expect(stepEnvelopeAllocation(up, "needs", -1)).toEqual(ALLOCATION_DEFAULTS);
	});

	it("en el tope no cambia nada", () => {
		const atCeiling = setEnvelopeAllocation(ALLOCATION_DEFAULTS, "needs", 70);
		expect(stepEnvelopeAllocation(atCeiling, "needs", 1)).toBe(atCeiling);
	});

	it("en 0 no baja más", () => {
		const atFloor = setEnvelopeAllocation(ALLOCATION_DEFAULTS, "wants", 0);
		expect(stepEnvelopeAllocation(atFloor, "wants", -1)).toBe(atFloor);
	});

	it("cualquier secuencia de toques termina en enteros ≥ 0 que suman 100", () => {
		let state = ALLOCATION_DEFAULTS;
		const taps = [
			["needs", 1],
			["needs", 1],
			["wants", -1],
			["wants", 1],
			["wants", 1],
			["wants", 1],
			["needs", 1],
			["needs", -1],
			["wants", -1],
		] as const;
		for (const [envelope, direction] of taps) {
			state = stepEnvelopeAllocation(state, envelope, direction);
			expect(sum(state)).toBe(100);
			for (const value of Object.values(state)) {
				expect(Number.isInteger(value)).toBe(true);
				expect(value).toBeGreaterThanOrEqual(0);
			}
		}
	});
});

describe("allocationValue / maxAllocation", () => {
	it("lee cada sobre y calcula el tope a partir del otro", () => {
		expect(allocationValue(ALLOCATION_DEFAULTS, "needs")).toBe(50);
		expect(allocationValue(ALLOCATION_DEFAULTS, "wants")).toBe(30);
		expect(allocationValue(ALLOCATION_DEFAULTS, "savings")).toBe(20);
		expect(maxAllocation(ALLOCATION_DEFAULTS, "needs")).toBe(70);
		expect(maxAllocation(ALLOCATION_DEFAULTS, "wants")).toBe(50);
	});
});
