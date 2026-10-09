import { api } from "@quipu/convex-api";
import { useMutation } from "convex/react";
import {
	type IncomeDraft,
	type IncomeRecord,
	toCreateIncomeEventArgs,
} from "@/shared/lib/income/draft";

export function useIncomeActions() {
	const createIncomeEvent = useMutation(api.incomeEvents.createIncomeEvent);

	return {
		register: async (draft: IncomeDraft, record?: IncomeRecord) => {
			if (!Number.isInteger(draft.amountCents) || draft.amountCents <= 0) {
				throw new Error("Ingresa un monto mayor a cero.");
			}
			await createIncomeEvent(toCreateIncomeEventArgs(draft, record));
		},
	};
}
