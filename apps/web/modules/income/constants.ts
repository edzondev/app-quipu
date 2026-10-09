import type { ExtraordinaryType } from "@/shared/lib/extraordinaryIncome";

export { getIncomeSourceLabel, INCOME_SOURCE_OPTIONS } from "@/shared/lib/incomeSource";

/** Máximo en céntimos para registrar ingreso. */
export const INCOME_MAX_CENTS = 99_999_999;

export const INCOME_PAGE_TITLE = "Registrar ingreso";
export const INCOME_PAGE_SUBTITLE = "Solo manual. Tú decides qué entra y cuándo.";
export const INCOME_PAGE_SUBTITLE_KIND = "¿Es tu sueldo de siempre o algo extraordinario?";
export const INCOME_EXTRAORDINARY_DETAILS_SUBTITLE =
	"Entra una vez. Tú decides a dónde va sin tocar tu sistema.";
export const INCOME_KIND_HABITUAL = "Ingreso habitual";
export const INCOME_KIND_EXTRAORDINARY = "Extraordinario";
export const INCOME_EXTRAORDINARY_PICK_HINT =
	"Tu configuración 50/30/20 no se toca. Esto es solo este ingreso.";
export const INCOME_EXTRAORDINARY_TYPE_SECTION = "¿Qué recibiste?";
export const INCOME_EXTRAORDINARY_CONTINUE_CTA = "Continuar";
export const INCOME_EXTRAORDINARY_BADGE = "Extraordinario";
export const INCOME_EXTRAORDINARY_RULE_PREFIX = "Regla activa";
export const INCOME_EXTRAORDINARY_RULE_CHANGE = "Cambiar";
export const INCOME_DESTINATION_DIALOG_CONFIRM = "Confirmar destino";
export const INCOME_DESTINATION_DIALOG_BACK = "Atrás";
export const INCOME_DESTINATION_DIALOG_NOTE =
	"Elijas lo que elijas, tu configuración no cambia. Esta decisión vale solo para este ingreso.";
export const INCOME_IMPACT_MOVE_SURPLUS = "Prefiero ahorrar más de este ingreso";
export const INCOME_AMOUNT_LABEL = "Monto recibido";
export const INCOME_SOURCE_LABEL = "Origen";
export const INCOME_DATE_LABEL = "Fecha";
export const INCOME_DATE_HINT =
	"Si el depósito fue otro día, elige la fecha en la que recibiste el dinero.";
export const INCOME_CONCEPT_LABEL = "Concepto";
export const INCOME_CONCEPT_OPTIONAL = "· opcional";
export const INCOME_IMPACT_TITLE = "Impacto en tus sobres";
export const INCOME_NEW_DAILY_LABEL = "Nuevo disponible hoy";
export const INCOME_CANCEL_CTA = "Cancelar";
export const INCOME_SUBMIT_CTA = "Registrar ingreso";
export const INCOME_EXTRAORDINARY_CUSTOM_LABEL = "Descripción";
export const INCOME_SUCCESS_TITLE = "Ingreso registrado";
export const INCOME_SUCCESS_BODY_PREFIX = "ya se repartieron.";
export const INCOME_SUCCESS_BODY_SUFFIX = "Tu ciclo respira mejor.";
export const INCOME_SUCCESS_DAILY_LABEL = "Disponible hoy ahora";
export const INCOME_HOME_CTA = "Volver al inicio";
export const INCOME_SUCCESS_MOVE_SURPLUS_CTA = INCOME_IMPACT_MOVE_SURPLUS;
export const INCOME_EXTRAORDINARY_SUCCESS_TITLE_SUFFIX = "registrada";
export const INCOME_EXTRAORDINARY_SUCCESS_BADGE = "Extraordinario";
export const INCOME_EXTRAORDINARY_SUCCESS_BODY_PROFILE_DEFAULT =
	"repartidos con tu distribución habitual. Tu sistema sigue idéntico.";
export const INCOME_EXTRAORDINARY_SUCCESS_BODY_ALL_TO_SAVINGS = "asignados por completo al ahorro.";

export const EXTRAORDINARY_TYPE_CARDS: ReadonlyArray<{
	type: ExtraordinaryType;
	title: string;
	subtitle: string;
	dashed?: boolean;
}> = [
	{
		type: "gratification_july",
		title: "Gratificación de julio",
		subtitle: "Sueldo extra de mitad de año",
	},
	{
		type: "gratification_december",
		title: "Gratificación de diciembre",
		subtitle: "Sueldo extra de fin de año",
	},
	{
		type: "cts",
		title: "CTS",
		subtitle: "Tu colchón de mayo y noviembre",
	},
	{
		type: "corporate_bonus",
		title: "Bono empresarial",
		subtitle: "Desempeño, cierre, campaña",
	},
	{
		type: "profit_sharing",
		title: "Utilidades",
		subtitle: "Reparto anual de tu empresa",
	},
	{
		type: "custom",
		title: "Otro extraordinario",
		subtitle: "Ponle nombre tú mismo",
		dashed: true,
	},
];

export function extraordinaryTypeDisplayTitle(type: ExtraordinaryType): string {
	return (
		EXTRAORDINARY_TYPE_CARDS.find((card) => card.type === type)?.title ?? "Ingreso extraordinario"
	);
}

export function getExtraordinarySubmitCta(type: ExtraordinaryType): string {
	switch (type) {
		case "gratification_july":
		case "gratification_december":
			return "Registrar gratificación";
		case "cts":
			return "Registrar CTS";
		case "corporate_bonus":
			return "Registrar bono";
		case "profit_sharing":
			return "Registrar utilidades";
		case "custom":
			return "Registrar ingreso";
	}
}

// P3-4: held amount field
export const INCOME_HELD_LABEL = "Ya comprometido";
export const INCOME_HELD_OPTIONAL = "· opcional";
export const INCOME_HELD_HINT =
	"No se reparte en tus sobres. Sirve para deudas u obligaciones que salen de este ingreso.";
export const INCOME_HELD_SUGGESTED = "Sugerido de compromisos sin cubrir";
export const INCOME_IMPACT_GROSS_LABEL = "Bruto";
export const INCOME_IMPACT_HELD_LABEL = "Apartado";
export const INCOME_IMPACT_DISTRIBUTABLE_LABEL = "A repartir";

export const ENVELOPE_INCOME_STYLES = {
	needs: {
		dot: "bg-steel",
		track: "bg-steel-soft",
		bar: "bg-steel",
	},
	wants: {
		dot: "bg-clay",
		track: "bg-clay-soft",
		bar: "bg-clay",
	},
	savings: {
		dot: "bg-moss",
		track: "bg-moss-soft",
		bar: "bg-moss",
	},
} as const;
