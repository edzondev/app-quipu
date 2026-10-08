/**
 * Helpers para construir propiedades de eventos con shape consistente.
 *
 * Los helpers centralizan decisiones que de otro modo quedarían duplicadas
 * en cada call site: cómo medir `days_remaining_in_cycle`, cómo normalizar
 * un `envelope` desde la API, etc.
 *
 * Si un día cambia la regla de cómo se computa una propiedad, se cambia acá
 * y todos los call sites se actualizan.
 */

import type { AdditionalSavingsSource, EnvelopeType, IncomeType } from "./events";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Días restantes en un ciclo financiero a partir de su `endDate` (timestamp).
 * Devuelve 0 si ya venció.
 */
export function daysRemainingInCycle(endDate: number, now: number = Date.now()): number {
	const diff = endDate - now;
	if (diff <= 0) return 0;
	return Math.ceil(diff / DAY_MS);
}

/**
 * Mapea el `fromSource` de `moveSurplusToSavings` a la propiedad `source`
 * del evento `additional_savings_added`. El form solo conoce el sobre
 * origen; lo cruzamos con un mapa heurístico.
 *
 *   - "needs" / "wants"      → "salary" (es el reparto habitual)
 *   - "extraordinary"         → "gratification" (proxy hasta que el form
 *                               capture el income_type original)
 */
export function mapSurplusSourceToAdditionalSavingsSource(
	fromSource: "needs" | "wants" | "extraordinary",
): AdditionalSavingsSource {
	if (fromSource === "extraordinary") return "gratification";
	return "salary";
}

/**
 * Mapea un `extraordinaryType` al `IncomeType` del evento `income_registered`.
 * Las gratificaciones se colapsan a "gratification"; CTS, bono, utilidades,
 * freelance y otros se mantienen tal cual.
 */
export function mapExtraordinaryTypeToIncomeType(
	extraordinaryType:
		| "gratification_july"
		| "gratification_december"
		| "cts"
		| "corporate_bonus"
		| "profit_sharing"
		| "custom"
		| undefined,
): IncomeType {
	if (!extraordinaryType) return "other";
	if (extraordinaryType === "gratification_july") return "gratification";
	if (extraordinaryType === "gratification_december") return "gratification";
	if (extraordinaryType === "cts") return "cts";
	if (extraordinaryType === "corporate_bonus") return "bonus";
	if (extraordinaryType === "profit_sharing") return "utilities";
	return "other";
}

/**
 * Mapea el `source` de un incomeEvent habitual al `IncomeType` del evento.
 * Solo `payroll` se mapea a "salary"; el resto pasa tal cual.
 */
export function mapHabitualSourceToIncomeType(
	source: "payroll" | "freelance" | "business" | "gift" | "refund" | "investment" | "other",
): IncomeType {
	if (source === "payroll") return "salary";
	if (source === "freelance") return "freelance";
	return "other";
}

/**
 * `distributionPolicy` se traduce a `allocation_mode` con la nomenclatura
 * del producto. `all_to_savings` se mantiene; `profile_default` se renombra
 * a "default" para que el dashboard de PostHog lo agrupe mejor.
 */
export function mapDistributionPolicyToAllocationMode(
	policy: "profile_default" | "all_to_savings" | undefined,
): "default" | "manual" | "all_to_savings" {
	if (policy === "all_to_savings") return "all_to_savings";
	if (policy === "profile_default") return "default";
	return "manual";
}

/**
 * Normaliza el tipo de sobre. La API ya devuelve literales, pero este
 * helper sirve de type guard para call sites que reciben `string`.
 */
export function toEnvelopeType(value: string): EnvelopeType | undefined {
	if (value === "needs" || value === "wants" || value === "savings") {
		return value;
	}
	return undefined;
}
