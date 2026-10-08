/**
 * Guards for envelope spend / reverse operations (pure, unit-tested).
 */

export function isEnvelopeFrozen(frozenUntil: number | undefined, now: number): boolean {
	return frozenUntil != null && now < frozenUntil;
}

/** I2 — congelar bloquea salidas (gastos nuevos, aumentos, transferencias salientes). */
export function allowsOutboundTransfer(frozenUntil: number | undefined, now: number): boolean {
	return !isEnvelopeFrozen(frozenUntil, now);
}

export function canReverseEnvelopeAllocation(input: {
	remainingAmount: number;
	reverseCents: number;
}): boolean {
	if (input.reverseCents <= 0) return true;
	return input.remainingAmount >= input.reverseCents;
}

export type EnvelopeReverseSlice = {
	type: "needs" | "wants" | "savings";
	remainingAmount: number;
};

/**
 * True when every envelope still has enough remaining to undo the given
 * distributionApplied snapshot (money not yet spent from that allocation).
 */
export function canReverseDistributionApplied(
	envelopes: ReadonlyArray<EnvelopeReverseSlice>,
	distributionApplied: {
		needs: number;
		wants: number;
		savings: number;
	},
): boolean {
	for (const envelope of envelopes) {
		const reverseCents = distributionApplied[envelope.type] ?? 0;
		if (
			!canReverseEnvelopeAllocation({
				remainingAmount: envelope.remainingAmount,
				reverseCents,
			})
		) {
			return false;
		}
	}
	return true;
}
