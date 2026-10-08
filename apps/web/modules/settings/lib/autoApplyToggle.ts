import type { ExtraordinaryRulesAutoApply } from "@/shared/lib/extraordinaryIncome";

export type AutoApplyToggleDecision = "paywall" | "skip" | "mutate";

/**
 * Decide si un click en el switch debe abrir paywall, ignorarse o mutar.
 * Evita doble envío mientras hay request en vuelo (sensación de “fallo”).
 */
export function decideAutoApplyToggle(input: {
	isPremium: boolean;
	pending: boolean;
	currentChecked: boolean;
	nextChecked: boolean;
}): AutoApplyToggleDecision {
	if (!input.isPremium) return "paywall";
	if (input.pending) return "skip";
	if (input.currentChecked === input.nextChecked) return "skip";
	return "mutate";
}

export function patchAutoApply(
	current: ExtraordinaryRulesAutoApply,
	key: keyof ExtraordinaryRulesAutoApply,
	checked: boolean,
): ExtraordinaryRulesAutoApply {
	return { ...current, [key]: checked };
}

/**
 * Solo aplica overrides que aún difieren del servidor (derivado en render,
 * sin useEffect para “limpiar” estado).
 */
export function activeOptimisticAutoApply(
	server: ExtraordinaryRulesAutoApply,
	optimistic: Partial<ExtraordinaryRulesAutoApply> | null,
): Partial<ExtraordinaryRulesAutoApply> | null {
	if (!optimistic) return null;
	const active: Partial<ExtraordinaryRulesAutoApply> = {};
	for (const key of Object.keys(optimistic) as Array<keyof ExtraordinaryRulesAutoApply>) {
		const value = optimistic[key];
		if (value !== undefined && value !== server[key]) {
			active[key] = value;
		}
	}
	return Object.keys(active).length > 0 ? active : null;
}

export function dropOptimisticKey(
	optimistic: Partial<ExtraordinaryRulesAutoApply> | null,
	key: keyof ExtraordinaryRulesAutoApply,
): Partial<ExtraordinaryRulesAutoApply> | null {
	if (!optimistic || !(key in optimistic)) return optimistic;
	const { [key]: _removed, ...rest } = optimistic;
	return Object.keys(rest).length > 0 ? rest : null;
}
