import { marketFromCurrencyCode, marketFromId } from "@/core/constants";
import { ONBOARDING_DEFAULTS } from "../constants";
import { finalPayloadSchema } from "../schemas";

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
 *
 * Importante: los defaults del wizard usan `null` en campos opcionales
 * (`payFrequency`), pero Zod `.optional()` no acepta `null`. Hay que
 * strippear null/undefined **después** de mezclar defaults — no antes —
 * o un independiente vuelve a quedar con `payFrequency: null` (QUIPU-APP-1).
 */
export function buildOnboardingPayload(input: unknown) {
	const raw = input && typeof input === "object" ? (input as Record<string, unknown>) : {};

	const merged: Record<string, unknown> = {
		...ONBOARDING_DEFAULTS,
		...raw,
	};

	const market =
		(typeof merged.marketId === "string"
			? marketFromId(merged.marketId as "pe" | "es" | "us")
			: undefined) ??
		(typeof merged.currencyCode === "string"
			? marketFromCurrencyCode(merged.currencyCode)
			: undefined);

	if (market) {
		merged.country = market.country;
		merged.currencyCode = market.currencyCode;
		merged.currencySymbol = market.currencySymbol;
	}

	const picked: Record<string, unknown> = {};
	for (const key of PROFILE_PAYLOAD_KEYS) {
		const value = merged[key as ProfilePayloadKey];
		if (isPresent(value)) {
			picked[key] = value;
		}
	}

	// Independiente: payFrequency/paydays no aplican (createProfile los rechaza).
	if (picked.incomeModel === "variable") {
		delete picked.payFrequency;
		delete picked.paydays;
		delete picked.mixedFixedAmount;
	}

	// Dependiente: campos de mixto/variable no aplican.
	if (picked.incomeModel === "fixed") {
		delete picked.cycleDurationDays;
		delete picked.mixedFixedAmount;
		delete picked.variableIncomeSources;
	}

	return finalPayloadSchema.parse(picked);
}
