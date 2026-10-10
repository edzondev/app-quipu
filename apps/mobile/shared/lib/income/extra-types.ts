import type { api } from "@quipu/convex-api";
import type { FunctionArgs } from "convex/server";
import type { IncomeModel } from "@/shared/lib/onboarding/types";

export type ExtraordinaryType = NonNullable<
	FunctionArgs<typeof api.incomeEvents.createIncomeEvent>["extraordinaryType"]
>;

/** Lo que el sheet muestra por cada tipo. El `Record` obliga a completarlo si Convex suma uno. */
export const EXTRA_COPY = {
	gratification_july: {
		title: "Gratificación de julio",
		chip: "Grati. julio",
		submit: "Registrar gratificación",
	},
	gratification_december: {
		title: "Gratificación de diciembre",
		chip: "Grati. diciembre",
		submit: "Registrar gratificación",
	},
	cts: { title: "CTS", chip: "CTS", submit: "Registrar CTS" },
	corporate_bonus: { title: "Bono empresarial", chip: "Bono", submit: "Registrar bono" },
	profit_sharing: { title: "Utilidades", chip: "Utilidades", submit: "Registrar utilidades" },
	custom: { title: "Extra", chip: "Otro", submit: "Registrar ingreso" },
} as const satisfies Record<ExtraordinaryType, { title: string; chip: string; submit: string }>;

/** Los que paga una planilla. */
const PAYROLL_EXTRAS = [
	"gratification_july",
	"gratification_december",
	"cts",
	"corporate_bonus",
	"profit_sharing",
] as const satisfies readonly ExtraordinaryType[];

/** El que sirve para todo lo demás, y el único para quien no está en planilla. */
export const GENERIC_EXTRA = "custom" satisfies ExtraordinaryType;

/**
 * Qué extraordinarios puede registrar cada modelo de ingreso. Quien cobra en planilla (fijo)
 * recibe gratificaciones, CTS, bonos y utilidades; un independiente o un mixto solo tiene
 * «extras», así que no hay nada que elegir. Sin perfil cargado tampoco se inventan tipos.
 */
export function extraTypesFor(model: IncomeModel | null | undefined): readonly ExtraordinaryType[] {
	return model === "fixed" ? [...PAYROLL_EXTRAS, GENERIC_EXTRA] : [GENERIC_EXTRA];
}
