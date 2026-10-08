import { api } from "@quipu/convex-api";
import { useMutation } from "convex/react";
import type { GenericId } from "convex/values";
import {
	type ExpenseDraftInput,
	ExpenseValidationError,
	validateExpenseDraft,
} from "@/shared/lib/expenses/draft";

function expenseId(id: string) {
	return id as GenericId<"expenses">;
}

function parseOrThrow(input: ExpenseDraftInput) {
	const parsed = validateExpenseDraft(input);
	if (!parsed.ok) throw new ExpenseValidationError(parsed.error);
	return parsed.value;
}

export function useExpenseActions() {
	const registerExpense = useMutation(api.expenses.registerExpense);
	const updateExpense = useMutation(api.expenses.updateExpense);
	const deleteExpense = useMutation(api.expenses.deleteExpense);

	return {
		register: async (input: ExpenseDraftInput) => registerExpense(parseOrThrow(input)),
		update: async (id: string, input: ExpenseDraftInput) =>
			updateExpense({ expenseId: expenseId(id), ...parseOrThrow(input) }),
		remove: (id: string) => deleteExpense({ expenseId: expenseId(id) }),
	};
}
