export type Allocation = { needs: number; wants: number; savings: number };

export type EnvelopeTargets = { needs: number; wants: number; savings: number };

export type SimpleCorrectionInput = {
	incomeCents: number;
	reservedWithCommitmentCents: number;
	reservedGenericCents: number;
	commitmentId: string | null;
	allocation: Allocation;
	spentPerEnvelope: EnvelopeTargets;
	targets: EnvelopeTargets;
};

export type SimpleCorrectionResult = {
	remainingByEnvelope: EnvelopeTargets;
	unallocatedCents: number;
	declaredLiquidCents: number;
	reserveToCommitments: Array<{ commitmentId: string; amountCents: number }>;
};

export function computeFreeCents(
	input: Pick<
		SimpleCorrectionInput,
		"incomeCents" | "reservedWithCommitmentCents" | "reservedGenericCents"
	>,
): number {
	return input.incomeCents - input.reservedWithCommitmentCents - input.reservedGenericCents;
}

export function proposeRemainingByEnvelope(input: {
	freeCents: number;
	allocation: Allocation;
	spentPerEnvelope: EnvelopeTargets;
}): EnvelopeTargets {
	const out = { needs: 0, wants: 0, savings: 0 };
	for (const key of ["needs", "wants", "savings"] as const) {
		const share = Math.floor((input.freeCents * input.allocation[key]) / 100);
		out[key] = Math.max(0, share - input.spentPerEnvelope[key]);
	}
	return out;
}

export function buildSimpleCorrectionPlan(input: SimpleCorrectionInput): SimpleCorrectionResult {
	if (input.reservedWithCommitmentCents > 0 && !input.commitmentId) {
		throw new Error("Elige o crea el compromiso para tu reserva");
	}
	if (input.reservedWithCommitmentCents + input.reservedGenericCents > input.incomeCents) {
		throw new Error("Lo apartado no puede superar lo ingresado");
	}
	const freeCents = computeFreeCents(input);
	const totalTargets = input.targets.needs + input.targets.wants + input.targets.savings;
	if (totalTargets > freeCents) {
		throw new Error("Los sobres no pueden superar el dinero libre");
	}
	const totalSpent =
		input.spentPerEnvelope.needs + input.spentPerEnvelope.wants + input.spentPerEnvelope.savings;
	if (
		totalTargets + input.reservedWithCommitmentCents + input.reservedGenericCents >
		input.incomeCents - totalSpent
	) {
		throw new Error("Repartes más dinero del que realmente tienes disponible");
	}
	return {
		remainingByEnvelope: { ...input.targets },
		unallocatedCents: input.reservedGenericCents,
		declaredLiquidCents:
			totalTargets + input.reservedWithCommitmentCents + input.reservedGenericCents,
		reserveToCommitments:
			input.reservedWithCommitmentCents > 0 && input.commitmentId
				? [
						{
							commitmentId: input.commitmentId,
							amountCents: input.reservedWithCommitmentCents,
						},
					]
				: [],
	};
}
