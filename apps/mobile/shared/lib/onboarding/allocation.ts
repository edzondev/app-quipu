import type { EnvelopeKey, OnboardingState } from "./types";

type Allocation = Pick<
	OnboardingState,
	"allocationNeeds" | "allocationWants" | "allocationSavings"
>;

export const ALLOCATION_DEFAULTS: Allocation = {
	allocationNeeds: 50,
	allocationWants: 30,
	allocationSavings: 20,
};

export const ENVELOPES: EnvelopeKey[] = ["needs", "wants", "savings"];

/** Puntos que sube o baja cada toque en un sobre. */
export const ALLOCATION_STEP = 5;

/**
 * Necesidades y Gustos los decide la persona; Ahorro es siempre lo que queda. Así ningún
 * número cambia solo: tocar un sobre mueve ese sobre y el resto del ingreso (Ahorro).
 */
export type EditableEnvelope = Exclude<EnvelopeKey, "savings">;

const STATE_KEY = {
	needs: "allocationNeeds",
	wants: "allocationWants",
} as const satisfies Record<EditableEnvelope, keyof Allocation>;

const OTHER_KEY = {
	needs: "allocationWants",
	wants: "allocationNeeds",
} as const satisfies Record<EditableEnvelope, keyof Allocation>;

export function allocationValue(state: Allocation, envelope: EnvelopeKey): number {
	if (envelope === "savings") return state.allocationSavings;
	return state[STATE_KEY[envelope]];
}

/** Lo más alto que puede llegar un sobre sin dejar a Ahorro en negativo. */
export function maxAllocation(state: Allocation, envelope: EditableEnvelope): number {
	return 100 - state[OTHER_KEY[envelope]];
}

/**
 * Fija Necesidades o Gustos en un entero válido (0 → lo que deja el otro sobre) y recalcula
 * Ahorro como el resto. Mismo valor ⇒ misma referencia.
 */
export function setEnvelopeAllocation(
	state: Allocation,
	envelope: EditableEnvelope,
	value: number,
): Allocation {
	const key = STATE_KEY[envelope];
	const next = Math.max(0, Math.min(maxAllocation(state, envelope), Math.round(value)));
	if (next === state[key]) return state;
	const needs = envelope === "needs" ? next : state.allocationNeeds;
	const wants = envelope === "wants" ? next : state.allocationWants;
	return {
		allocationNeeds: needs,
		allocationWants: wants,
		allocationSavings: 100 - needs - wants,
	};
}

export function stepEnvelopeAllocation(
	state: Allocation,
	envelope: EditableEnvelope,
	direction: 1 | -1,
): Allocation {
	return setEnvelopeAllocation(
		state,
		envelope,
		allocationValue(state, envelope) + direction * ALLOCATION_STEP,
	);
}

export type { Allocation };
