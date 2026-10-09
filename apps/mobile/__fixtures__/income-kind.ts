import type { api } from "@quipu/convex-api";
import type { FunctionArgs } from "convex/server";

type IncomeKind = NonNullable<
	FunctionArgs<typeof api.incomeEvents.createIncomeEvent>["incomeKind"]
>;

/** Sueldo. El servidor asume este valor si el cliente no manda incomeKind. */
export const sueldoKind = "habitual" satisfies IncomeKind;

/** Extra. No existe el literal "extra". */
export const extraKind = "extraordinary" satisfies IncomeKind;
