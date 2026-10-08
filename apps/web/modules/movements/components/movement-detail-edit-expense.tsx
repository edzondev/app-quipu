"use client";

import { useMutation } from "convex/react";
import { useCallback } from "react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { ExpenseEditForm } from "./expense-edit-form";
import type { MovementForDetail } from "./movement-detail-sheet";

type Props = {
	movement: MovementForDetail;
	currencyCode: string;
	onSuccess: () => void;
	onCancel: () => void;
};

/** Wrapper del formulario de edición de gasto — adapta la mutación de Convex. */
export function MovementDetailEditExpense({ movement, currencyCode, onSuccess, onCancel }: Props) {
	const updateExpense = useMutation(api.expenses.updateExpense);
	const handleUpdate = useCallback(
		async (args: {
			expenseId: string;
			amount: number;
			description: string;
			envelopeType: "needs" | "wants";
		}) =>
			updateExpense({
				expenseId: args.expenseId as Id<"expenses">,
				amount: args.amount,
				description: args.description,
				envelopeType: args.envelopeType,
			}),
		[updateExpense],
	);

	return (
		<ExpenseEditForm
			autoFocus
			expenseId={movement.id}
			initialAmountCents={movement.amount}
			initialDescription={movement.label}
			initialEnvelopeType={movement.envelopeType ?? "wants"}
			currencyCode={currencyCode}
			updateExpense={handleUpdate}
			onSuccess={onSuccess}
			onCancel={onCancel}
		/>
	);
}
