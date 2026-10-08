import { PAYDAYS_BY_FREQUENCY } from "./defaults";
import { DEFAULT_MARKET, marketFromCurrencyCode, marketFromId } from "./markets";
import { finalPayloadSchema } from "./schemas";
import type { PayFrequency } from "./types";

const PROFILE_PAYLOAD_KEYS = [
	"name",
	"country",
	"currencyCode",
	"currencySymbol",
	"incomeModel",
	"payFrequency",
	"paydays",
	"cycleDurationDays",
	"mixedFixedAmount",
	"variableIncomeSources",
	"allocationNeeds",
	"allocationWants",
	"allocationSavings",
] as const;

type ProfilePayloadKey = (typeof PROFILE_PAYLOAD_KEYS)[number];

function isPresent(value: unknown): boolean {
	if (value == null) return false;
	if (Array.isArray(value) && value.length === 0) return false;
	return true;
}

/**
 * Normaliza el estado del wizard al payload de `profiles.createProfile`.
 * Los paydays son SIEMPRE nominales por frecuencia (spec: el usuario no los
 * elige; el ciclo real se ancla a la fecha del ingreso registrado).
 */
export function buildOnboardingPayload(input: unknown) {
	const raw = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
	const merged: Record<string, unknown> = { ...raw };

	const market =
		(typeof merged.marketId === "string"
			? marketFromId(merged.marketId as "pe" | "es" | "us")
			: undefined) ??
		marketFromCurrencyCode(typeof merged.currencyCode === "string" ? merged.currencyCode : "") ??
		DEFAULT_MARKET;

	merged.country = market.country;
	merged.currencyCode = market.currencyCode;
	merged.currencySymbol = market.currencySymbol;

	if (typeof merged.payFrequency === "string" && merged.payFrequency in PAYDAYS_BY_FREQUENCY) {
		merged.paydays = PAYDAYS_BY_FREQUENCY[merged.payFrequency as PayFrequency];
	}
	if (merged.mixedFixedAmountCents != null) {
		merged.mixedFixedAmount = merged.mixedFixedAmountCents;
	}

	const picked: Record<string, unknown> = {};
	for (const key of PROFILE_PAYLOAD_KEYS) {
		const value = merged[key as ProfilePayloadKey];
		if (isPresent(value)) picked[key] = value;
	}

	if (picked.incomeModel === "variable") {
		delete picked.payFrequency;
		delete picked.paydays;
		delete picked.mixedFixedAmount;
	}
	if (picked.incomeModel === "fixed") {
		delete picked.cycleDurationDays;
		delete picked.mixedFixedAmount;
		delete picked.variableIncomeSources;
	}

	return finalPayloadSchema.parse(picked);
}
