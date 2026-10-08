export type RescueSuggestion = {
	transfer: number;
	projectedDeficit: number;
};

export type RescueEnvelopeBalances = {
	savingsRemaining: number;
	wantsRemaining: number;
};

export type RescueApplyValidation =
	| { ok: true; transfer: number }
	| {
			ok: false;
			reason: "NO_SUGGESTION" | "INVALID_TRANSFER" | "INSUFFICIENT_SAVINGS" | "NO_RESCUE_NEEDED";
	  };

export function validateRescueTransferApply(
	suggestion: RescueSuggestion | null | undefined,
	balances: RescueEnvelopeBalances,
): RescueApplyValidation {
	if (!suggestion || suggestion.transfer <= 0) {
		return { ok: false, reason: "NO_SUGGESTION" };
	}

	if (!Number.isInteger(suggestion.transfer) || suggestion.transfer <= 0) {
		return { ok: false, reason: "INVALID_TRANSFER" };
	}

	if (balances.wantsRemaining >= 0) {
		return { ok: false, reason: "NO_RESCUE_NEEDED" };
	}

	if (balances.savingsRemaining < suggestion.transfer) {
		return { ok: false, reason: "INSUFFICIENT_SAVINGS" };
	}

	return { ok: true, transfer: suggestion.transfer };
}

export function computeRescueEnvelopePatches(
	balances: RescueEnvelopeBalances,
	transfer: number,
): { savingsRemaining: number; wantsRemaining: number } {
	return {
		savingsRemaining: balances.savingsRemaining - transfer,
		wantsRemaining: balances.wantsRemaining + transfer,
	};
}
