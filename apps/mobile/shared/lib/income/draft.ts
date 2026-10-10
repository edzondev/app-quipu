import type { api } from "@quipu/convex-api";
import type { FunctionArgs } from "convex/server";
import { EXTRA_COPY, type ExtraordinaryType, GENERIC_EXTRA } from "@/shared/lib/income/extra-types";
import { HABITUAL_INCOME_LABEL, HABITUAL_INCOME_SOURCE } from "@/shared/lib/income/source";
import { limaStartOfDay } from "@/shared/lib/lima-date";

export type CreateIncomeEventArgs = FunctionArgs<typeof api.incomeEvents.createIncomeEvent>;
export type IncomeKind = NonNullable<CreateIncomeEventArgs["incomeKind"]>;
type DistributionPolicy = NonNullable<CreateIncomeEventArgs["distributionPolicy"]>;

/** Opción recomendada del diálogo de destino y fallback de submit en la web. */
const EXTRA_POLICY = "profile_default" satisfies DistributionPolicy;
/** Etiqueta que exige el servidor para `custom`; solo ese tipo la lleva. */
const GENERIC_EXTRA_LABEL = EXTRA_COPY[GENERIC_EXTRA].title;

/** Lo que se registra: un sueldo que abre ciclo, o un extra que dice qué tipo es. */
export type IncomeDraft =
	| { incomeKind: "habitual"; amountCents: number; occurredAt: number }
	| {
			incomeKind: "extraordinary";
			extraordinaryType: ExtraordinaryType;
			amountCents: number;
			occurredAt: number;
	  };

/** Lo que el formulario edita: el tipo viaja siempre y solo cuenta si el ingreso es un extra. */
export type IncomeFormValues = {
	amountCents: number;
	occurredAt: number;
	incomeKind: IncomeKind;
	extraordinaryType: ExtraordinaryType;
};

export function defaultIncomeFormValues(now = Date.now()): IncomeFormValues {
	return {
		amountCents: 0,
		occurredAt: limaStartOfDay(now),
		incomeKind: "habitual",
		extraordinaryType: GENERIC_EXTRA,
	};
}

export function incomeDraftFromForm(values: IncomeFormValues): IncomeDraft {
	const { amountCents, occurredAt, incomeKind, extraordinaryType } = values;
	if (incomeKind === "habitual") return { incomeKind, amountCents, occurredAt };
	return { incomeKind, extraordinaryType, amountCents, occurredAt };
}

export function toCreateIncomeEventArgs(draft: IncomeDraft): CreateIncomeEventArgs {
	if (draft.incomeKind === "habitual") {
		return {
			amount: draft.amountCents,
			source: HABITUAL_INCOME_SOURCE,
			description: HABITUAL_INCOME_LABEL,
			occurredAt: draft.occurredAt,
			incomeKind: draft.incomeKind,
		};
	}
	const { extraordinaryType } = draft;
	const base = {
		amount: draft.amountCents,
		// El servidor vuelve a derivar origen y descripción del tipo; se mandan los mismos.
		source: extraordinaryType === GENERIC_EXTRA ? "other" : "payroll",
		description: EXTRA_COPY[extraordinaryType].title,
		occurredAt: draft.occurredAt,
		incomeKind: draft.incomeKind,
		extraordinaryType,
		distributionPolicy: EXTRA_POLICY,
	} satisfies CreateIncomeEventArgs;
	if (extraordinaryType !== GENERIC_EXTRA) return base;
	return { ...base, extraordinaryLabel: GENERIC_EXTRA_LABEL };
}
