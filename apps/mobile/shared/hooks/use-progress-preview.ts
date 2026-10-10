import { useSyncExternalStore } from "react";
import type { ProgressScenarioId, ProgressSource } from "@/shared/dev/progress-scenarios";

type ProgressScenarios = typeof import("@/shared/dev/progress-scenarios").PROGRESS_SCENARIOS;

/**
 * Los escenarios solo existen en desarrollo: el `require` queda dentro de `__DEV__` para que
 * el bundle de producción ni los incluya. La selección es global para que Progreso y el
 * detalle del cierre muestren el mismo escenario.
 */
export function progressScenarios(): ProgressScenarios | null {
	if (__DEV__) {
		const module: typeof import("@/shared/dev/progress-scenarios") = require("@/shared/dev/progress-scenarios");
		return module.PROGRESS_SCENARIOS;
	}
	return null;
}

let selected: ProgressScenarioId | null = null;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
}

export function selectProgressScenario(id: ProgressScenarioId | null) {
	if (selected === id) return;
	selected = id;
	for (const listener of listeners) listener();
}

export function useProgressPreview(): {
	selected: ProgressScenarioId | null;
	source: ProgressSource | null;
} {
	const current = useSyncExternalStore(
		subscribe,
		() => selected,
		() => null,
	);
	const scenarios = progressScenarios();
	if (scenarios === null || current === null) return { selected: null, source: null };
	return { selected: current, source: scenarios[current].source };
}
