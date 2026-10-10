import { ConvexError } from "convex/values";
import { ENVELOPE_TYPES } from "./budgetMath";
import { envelopeWithCarry } from "./cycleCarryover";
import { buildDefaultAllocationPlan } from "./defaultAllocationPlan";

export const OPENING_BALANCE_MESSAGE =
	"El saldo debe ser un entero de céntimos mayor o igual a cero.";

export const FIRST_CYCLE_EXISTS_MESSAGE = "Tu primer ciclo ya está creado.";

export function assertOpeningBalanceCents(openingBalanceCents: number): void {
	if (Number.isInteger(openingBalanceCents) && openingBalanceCents >= 0) return;
	throw new ConvexError({
		code: "VALIDATION_ERROR",
		message: OPENING_BALANCE_MESSAGE,
		data: { field: "openingBalanceCents" },
	});
}

/** Web onboarding finishes here. Mobile defers the flag to `startFirstCycle`. */
export function onboardingCompleteOnCreate(completeOnboarding: boolean | undefined): boolean {
	return completeOnboarding !== false;
}

export function firstCycleOnboardingRetry(input: {
	hasCycle: boolean;
	onboardingComplete: boolean;
}): { action: "create" | "already_exists" | "complete_existing" } {
	if (!input.hasCycle) return { action: "create" };
	if (input.onboardingComplete) return { action: "already_exists" };
	return { action: "complete_existing" };
}

export function assertFirstCycleAvailable(hasPersonalCycle: boolean): void {
	if (!hasPersonalCycle) return;
	throw new ConvexError({
		code: "ALREADY_EXISTS",
		message: FIRST_CYCLE_EXISTS_MESSAGE,
	});
}

/** Reparte el saldo de hoy con los porcentajes del perfil y lo guarda como arrastre. */
export function openingEnvelopes(input: {
	openingBalanceCents: number;
	allocationNeeds: number;
	allocationWants: number;
	allocationSavings: number;
}) {
	const plan = buildDefaultAllocationPlan({
		amountCents: input.openingBalanceCents,
		weights: {
			allocationNeeds: input.allocationNeeds,
			allocationWants: input.allocationWants,
			allocationSavings: input.allocationSavings,
		},
	});
	return ENVELOPE_TYPES.map((type) => ({
		type,
		...envelopeWithCarry(0, plan.envelopes[type]),
	}));
}
