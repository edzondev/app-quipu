type Origin = { x: number; y: number };

/**
 * Aplica un cambio de tema con el efecto de revelado circular de
 * https://theme-toggle.rdsx.dev/ (View Transitions API). El círculo nace
 * desde el punto de click; sin soporte o con `prefers-reduced-motion`,
 * aplica el cambio directo sin animación.
 */
export function themeChangeTransition(apply: () => void, origin?: Origin) {
	const supported =
		typeof document !== "undefined" &&
		typeof document.startViewTransition === "function" &&
		!window.matchMedia("(prefers-reduced-motion: reduce)").matches;

	if (!supported) {
		apply();
		return;
	}

	const root = document.documentElement;
	if (origin) {
		root.style.setProperty("--vt-x", `${origin.x}px`);
		root.style.setProperty("--vt-y", `${origin.y}px`);
	}

	const transition = document.startViewTransition(apply);
	void transition.finished.finally(() => {
		if (origin) {
			root.style.removeProperty("--vt-x");
			root.style.removeProperty("--vt-y");
		}
	});
}
