import type { api } from "@quipu/convex-api";
import type { FunctionReturnType } from "convex/server";
import type { ExpenseDraftInput, ExpenseEnvelope } from "./draft";

export type RecentExpensesResult = FunctionReturnType<typeof api.expenses.getRecentExpenses>;

export type CycleMovementsResult = FunctionReturnType<typeof api.movements.listForActiveCycle>;

export type ExpenseEnvelopeChoice = ExpenseEnvelope | "savings";

export type ExpenseView = {
	id: string;
	amountCents: number;
	description: string;
	envelopeType: ExpenseEnvelopeChoice | null;
	timestamp: number;
};

export type ExpenseLookup =
	| { status: "loading" }
	| { status: "missing" }
	| { status: "ready"; expense: ExpenseView };

export type FrequentExpense = {
	id: string;
	label: string;
	amountCents: number;
};

export function lookupExpense(
	movements: CycleMovementsResult | undefined,
	expenseId: string,
): ExpenseLookup {
	if (movements === undefined) return { status: "loading" };
	if (!movements || !Array.isArray(movements.movements)) {
		return { status: "missing" };
	}

	for (const movement of movements.movements) {
		if (movement?.kind !== "expense" || movement.id !== expenseId) {
			continue;
		}
		return {
			status: "ready",
			expense: {
				id: movement.id,
				amountCents: typeof movement.amount === "number" ? Math.trunc(movement.amount) : 0,
				description: typeof movement.label === "string" ? movement.label : "",
				envelopeType: readMovementEnvelope(movement),
				timestamp: typeof movement.timestamp === "number" ? movement.timestamp : Date.now(),
			},
		};
	}

	return { status: "missing" };
}

export function mapFrequentExpenses(recent: RecentExpensesResult | undefined): FrequentExpense[] {
	if (!Array.isArray(recent)) return [];
	const seen = new Set<string>();
	const chips: FrequentExpense[] = [];
	for (const item of recent) {
		if (!item || typeof item.description !== "string") continue;
		const label = item.description.trim();
		if (!label) continue;
		const key = label.toLocaleLowerCase("es-PE");
		if (seen.has(key)) continue;
		if (typeof item.amount !== "number") continue;
		seen.add(key);
		chips.push({
			id: String(item._id),
			label,
			amountCents: Math.trunc(item.amount),
		});
	}
	return chips;
}

export function routeParam(value: unknown): string {
	if (typeof value === "string") return value;
	if (Array.isArray(value) && typeof value[0] === "string") return value[0];
	return "";
}

export function readEnvelopeParam(value: string): ExpenseDraftInput["envelopeType"] {
	if (value === "needs" || value === "wants" || value === "savings") return value;
	return null;
}

export function readCreateDraft(input: {
	amountRaw: string;
	description: string;
	envelopeType: string;
}): ExpenseDraftInput {
	return {
		amountRaw: input.amountRaw,
		description: input.description,
		envelopeType: readEnvelopeParam(input.envelopeType),
	};
}

function readMovementEnvelope(movement: {
	envelopeType?: string;
	envelopeLabel?: string;
}): ExpenseEnvelopeChoice | null {
	if (
		movement.envelopeType === "needs" ||
		movement.envelopeType === "wants" ||
		movement.envelopeType === "savings"
	) {
		return movement.envelopeType;
	}
	if (movement.envelopeLabel === "Ahorro") return "savings";
	return null;
}
