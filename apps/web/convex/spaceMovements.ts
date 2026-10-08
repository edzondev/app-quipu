import type { Doc } from "./_generated/dataModel";

const MOVEMENTS_LIST_LIMIT = 500;

function envelopeLabel(type: "needs" | "wants" | "savings"): string {
	switch (type) {
		case "needs":
			return "Necesidades";
		case "wants":
			return "Gustos";
		case "savings":
			return "Ahorro";
	}
}

export function buildSpaceMovements(
	expenses: Doc<"spaceExpenses">[],
	contributions: Doc<"spaceContributions">[],
	limit = MOVEMENTS_LIST_LIMIT,
) {
	const expenseRows = expenses.map((expense) => ({
		id: expense._id as string,
		kind: "expense" as const,
		label: expense.description,
		envelopeLabel: envelopeLabel(expense.envelopeType),
		fundingSource: expense.fundingSource,
		amount: expense.amount,
		timestamp: expense.timestamp,
	}));

	const contributionRows = contributions.map((contribution) => ({
		id: contribution._id as string,
		kind: "contribution" as const,
		label:
			contribution.kind === "explicit_transfer"
				? "Aporte al espacio"
				: "Gasto pagado personalmente",
		envelopeLabel: contribution.envelopeType ? envelopeLabel(contribution.envelopeType) : undefined,
		amount: contribution.amountCents,
		timestamp: contribution.createdAt,
	}));

	return [...expenseRows, ...contributionRows]
		.sort((a, b) => b.timestamp - a.timestamp)
		.slice(0, limit);
}

export type SpaceMovementRow = ReturnType<typeof buildSpaceMovements>[number];
