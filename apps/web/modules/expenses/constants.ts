export const EXPENSE_FLOW_TITLE = "Nuevo gasto";
export const EXPENSE_AMOUNT_LABEL = "Monto";
export const EXPENSE_ENVELOPE_QUESTION = "¿De qué sobre sale?";
export const EXPENSE_SUGGESTED_BADGE = "Sugerido";
export const EXPENSE_NEXT_CTA = "Siguiente";
export const EXPENSE_CONFIRM_CTA = "Confirmar en";
export const EXPENSE_REGISTER_CTA = "Registrar gasto";
export const EXPENSE_SUCCESS_TITLE = "Gasto registrado";
export const EXPENSE_SUCCESS_ELAPSED = "Registrado en";
export const EXPENSE_SUCCESS_ELAPSED_SUFFIX = "segundos";
export const EXPENSE_REMAINING_PREFIX = "Te quedan";
export const EXPENSE_REMAINING_SUFFIX = "este ciclo";
export const EXPENSE_CONCEPT_LABEL = "Concepto";
export const EXPENSE_CONCEPT_OPTIONAL = "· opcional";
export const EXPENSE_PRESELECTED_SUFFIX = "· preseleccionado";
export const EXPENSE_NO_CYCLE_HINT = "Registra un ingreso primero para activar tu ciclo.";
export const EXPENSE_VARIANT_B_TITLE_PREFIX = "Gasto en";

export const ENVELOPE_EXPENSE_STYLES = {
	needs: {
		dot: "bg-steel",
		selectedBorder: "border-steel",
		selectedBg: "bg-steel-soft",
		pillBg: "bg-steel-soft",
		pillBorder: "border-steel/30",
		pillText: "text-steel",
		badgeBg: "bg-steel-soft",
		badgeText: "text-steel",
		hintText: "text-steel",
	},
	wants: {
		dot: "bg-clay",
		selectedBorder: "border-clay",
		selectedBg: "bg-clay-soft",
		pillBg: "bg-clay-soft",
		pillBorder: "border-clay/30",
		pillText: "text-clay",
		badgeBg: "bg-clay-soft",
		badgeText: "text-clay",
		hintText: "text-clay",
	},
} as const;
