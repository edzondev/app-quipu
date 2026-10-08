export type EnvelopeType = "needs" | "wants" | "savings";

export type AllocationWeights = {
	allocationNeeds: number;
	allocationWants: number;
	allocationSavings: number;
};

export type EnvelopeAmounts = Record<EnvelopeType, number>;

export type DistributionPolicy = "profile_default" | "all_to_savings";

const ENVELOPE_TYPES: EnvelopeType[] = ["needs", "wants", "savings"];

/** Largest-remainder split; sums exactly to `netAvailableCents`. */
export function computeAllocations(
	netAvailableCents: number,
	weights: AllocationWeights,
): EnvelopeAmounts {
	const w: EnvelopeAmounts = {
		needs: weights.allocationNeeds,
		wants: weights.allocationWants,
		savings: weights.allocationSavings,
	};
	const total = w.needs + w.wants + w.savings;
	if (total <= 0) {
		throw new Error("La distribución del perfil es inválida (suma 0).");
	}

	const parts = ENVELOPE_TYPES.map((type) => {
		const exact = (netAvailableCents * w[type]) / total;
		const floor = Math.floor(exact);
		return { type, floor, frac: exact - floor };
	});

	const result: EnvelopeAmounts = { needs: 0, wants: 0, savings: 0 };
	for (const part of parts) result[part.type] = part.floor;

	let remainder = netAvailableCents - parts.reduce((acc, part) => acc + part.floor, 0);
	const byFracDesc = [...parts].sort((a, b) => b.frac - a.frac);
	for (let i = 0; remainder > 0; i++, remainder--) {
		const part = byFracDesc[i % byFracDesc.length];
		if (part) result[part.type] += 1;
	}

	return result;
}

export function applyDistributionPolicy(
	netAvailableCents: number,
	weights: AllocationWeights,
	policy: DistributionPolicy,
): EnvelopeAmounts {
	if (policy === "all_to_savings") {
		return {
			needs: 0,
			wants: 0,
			savings: netAvailableCents,
		};
	}
	return computeAllocations(netAvailableCents, weights);
}
