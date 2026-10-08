export type Crumb = {
	label: string;
	href?: string;
};

const HOME: Crumb = { label: "Inicio", href: "/dashboard" };

/** null = hide breadcrumb (home + first-level hubs). */
const STATIC_ROUTES: Record<string, Crumb[] | null> = {
	"/dashboard": null,
	"/movements": [HOME, { label: "Movimientos" }],
	"/commitments": [HOME, { label: "Compromisos" }],
	"/savings": null,
	"/savings/move": [HOME, { label: "Ahorros", href: "/savings" }, { label: "Mover sobrante" }],
	"/savings/move/success": [
		HOME,
		{ label: "Ahorros", href: "/savings" },
		{ label: "Mover sobrante", href: "/savings/move" },
		{ label: "Guardado" },
	],
	"/savings/fund": [HOME, { label: "Ahorros", href: "/savings" }, { label: "Fondo de emergencia" }],
	"/income/register": [HOME, { label: "Registrar ingreso" }],
	"/settings": null,
	"/settings/account": [HOME, { label: "Ajustes", href: "/settings" }, { label: "Cuenta" }],
	"/settings/cycle": [HOME, { label: "Ajustes", href: "/settings" }, { label: "Ciclo de pago" }],
	"/settings/allocations": [HOME, { label: "Ajustes", href: "/settings" }, { label: "Reparto" }],
	"/settings/system": [HOME, { label: "Ajustes", href: "/settings" }, { label: "Sistema" }],
	"/settings/feedback": [HOME, { label: "Ajustes", href: "/settings" }, { label: "Feedback" }],
	"/progress": [HOME, { label: "Progreso" }],
	"/progress/rewards": [HOME, { label: "Progreso", href: "/progress" }, { label: "Logros" }],
	"/espacios": [HOME, { label: "Espacios" }],
	"/cycle/correct": [HOME, { label: "Corregir ciclo" }],
};

function matchDynamicRoute(pathname: string): Crumb[] | null {
	const espacioMatch = pathname.match(/^\/espacios\/([^/]+)(?:\/(.+))?$/);
	if (!espacioMatch) return null;

	const [, spaceId, subPath] = espacioMatch;
	const spaceCrumb: Crumb = {
		label: "Espacio",
		href: `/espacios/${spaceId}`,
	};

	if (!subPath) {
		return [HOME, { label: "Espacios", href: "/espacios" }, { label: "Espacio" }];
	}

	if (subPath === "configuracion") {
		return [HOME, { label: "Espacios", href: "/espacios" }, spaceCrumb, { label: "Configuración" }];
	}

	return null;
}

/** Returns crumbs for a pathname, or null when breadcrumbs should be hidden. */
export function resolveBreadcrumbs(pathname: string): Crumb[] | null {
	const normalized = pathname.replace(/\/$/, "") || "/";

	if (normalized in STATIC_ROUTES) {
		return STATIC_ROUTES[normalized] ?? null;
	}

	return matchDynamicRoute(normalized);
}
