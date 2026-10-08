export const SAVINGS_ASSIGN_RATIONALES = [
	"fund_first",
	"complete_nearest_goal",
	"fund_reinforce",
] as const;

export type SavingsAssignRationale = (typeof SAVINGS_ASSIGN_RATIONALES)[number];

export type SavingsAssignTargetSlice = {
	subEnvelopeId: string;
	label: string;
	currentAmount: number;
	/** 0 = meta abierta (sin objetivo). */
	targetAmount: number;
};

export type SavingsAssignPlanLine = {
	subEnvelopeId: string;
	label: string;
	suggestedCents: number;
	remainingToTargetCents: number;
};

export type SavingsAssignPlan = {
	lines: SavingsAssignPlanLine[];
	totalCents: number;
	rationale: SavingsAssignRationale;
};

function buildLine(target: SavingsAssignTargetSlice, cents: number): SavingsAssignPlanLine {
	return {
		subEnvelopeId: target.subEnvelopeId,
		label: target.label,
		suggestedCents: cents,
		remainingToTargetCents: Math.max(0, target.targetAmount - target.currentAmount),
	};
}

export function buildSavingsAssignPlan(input: {
	availableCents: number;
	emergencyFund: SavingsAssignTargetSlice;
	goals: ReadonlyArray<SavingsAssignTargetSlice>;
}): SavingsAssignPlan | null {
	const available = Math.max(0, Math.floor(input.availableCents));
	if (available <= 0) return null;

	const fund = input.emergencyFund;
	const fundRemainingToTarget = Math.max(0, fund.targetAmount - fund.currentAmount);

	let fundCents = Math.min(available, fundRemainingToTarget);
	let remaining = available - fundCents;

	const incompleteGoals = input.goals
		.filter((goal) => goal.targetAmount > goal.currentAmount)
		.sort((a, b) => a.targetAmount - a.currentAmount - (b.targetAmount - b.currentAmount));

	const goalLines: Array<{ target: SavingsAssignTargetSlice; cents: number }> = [];
	for (const goal of incompleteGoals) {
		if (remaining === 0) break;
		const take = Math.min(remaining, goal.targetAmount - goal.currentAmount);
		goalLines.push({ target: goal, cents: take });
		remaining -= take;
	}

	if (remaining > 0) {
		const openGoal = input.goals.find((goal) => goal.targetAmount === 0);
		if (openGoal) {
			goalLines.push({ target: openGoal, cents: remaining });
			remaining = 0;
		} else {
			fundCents += remaining;
			remaining = 0;
		}
	}

	const lines: SavingsAssignPlanLine[] = [];
	if (fundCents > 0) {
		lines.push(buildLine(fund, fundCents));
	}
	for (const { target, cents } of goalLines) {
		lines.push(buildLine(target, cents));
	}

	if (lines.length === 0) return null;

	const rationale: SavingsAssignRationale =
		fundRemainingToTarget > 0
			? "fund_first"
			: incompleteGoals.length > 0
				? "complete_nearest_goal"
				: "fund_reinforce";
	return { lines, totalCents: available, rationale };
}

export function validateSavingsAssignLines(
	lines: ReadonlyArray<{ subEnvelopeId: string; amount: number }>,
	input: { availableCents: number; ownedIds: ReadonlySet<string> | string[] },
): Array<{ subEnvelopeId: string; amount: number }> {
	const ownedIds = new Set(input.ownedIds);
	const seen = new Set<string>();
	let total = 0;
	const normalized = lines.map((line) => {
		if (!Number.isInteger(line.amount) || line.amount <= 0) {
			throw new Error("Cada monto debe ser un entero de céntimos mayor a cero.");
		}
		if (!ownedIds.has(line.subEnvelopeId)) {
			throw new Error("Destino de ahorro no válido.");
		}
		if (seen.has(line.subEnvelopeId)) {
			throw new Error("Cada destino solo puede aparecer una vez.");
		}
		seen.add(line.subEnvelopeId);
		total += line.amount;
		return { subEnvelopeId: line.subEnvelopeId, amount: line.amount };
	});
	if (normalized.length === 0) {
		throw new Error("Agrega al menos un destino para tu ahorro.");
	}
	if (total > input.availableCents) {
		throw new Error("El reparto supera el saldo disponible del sobre de ahorro.");
	}
	return normalized;
}
