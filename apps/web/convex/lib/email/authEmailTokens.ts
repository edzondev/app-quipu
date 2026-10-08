/**
 * Hex fijos para HTML de correo (clientes no interpretan oklch de globals.css).
 * Alineados al canon Quipu §3.3 y tokens --qp-* en app/globals.css (acento verde default).
 */
export const authEmailColors = {
	/** Acento musgo (--qp-moss / Ahorro) */
	moss: "#5E8C79",
	/** CTA sólido (--qp-deep / --qpB) */
	deep: "#2C5D52",
	/** Fondo exterior (--qp-canvas-page) */
	canvas: "#EDEAE4",
	/** Cuerpo (--qp-body / --text) */
	body: "#5A554E",
	/** Bordes sutiles (--qp-line / --border) */
	line: "#E1DCD4",
	/** Superficie clara acento (--qp-tint / --qp01) */
	tint: "#E9F0EC",
	/** Titulares (--qp-ink / --text-strong) */
	ink: "#23201C",
	/** Tarjeta (--qp-surface) */
	surface: "#FFFFFF",
	/** Texto sobre botón primario */
	onDeep: "#FBFAF7",
} as const;

export const authEmailFonts = {
	serif: 'Georgia, "Times New Roman", serif',
	sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
} as const;

export const authEmailLayout = {
	maxWidth: 600,
	cardRadius: 10,
	accentBarWidth: 4,
	cardShadow: "0 22px 55px -30px rgba(35, 32, 28, 0.4), 0 2px 4px rgba(35, 32, 28, 0.05)",
} as const;
