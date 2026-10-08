import type { EnvelopeKey } from "@/shared/lib/onboarding/types";

export type SegmentColor = EnvelopeKey;

export type IntroSlide = {
	eyebrow: string;
	title: string;
	body?: string;
	quote?: string;
	segmentBar?: boolean;
	segments?: { label: string; pct: string; color: SegmentColor }[];
	segmentNote?: string;
	dailyCard?: { label: string; value: string };
	rules?: string[];
	cta: string;
	ctaAction: "next" | "sign-up";
	signInLink?: boolean;
};

export const INTRO_SLIDES: IntroSlide[] = [
	{
		eyebrow: "QUIPU",
		title: "Divide tu dinero antes de gastarlo, no después.",
		body: "No es una app de cuentas ni un banco. Es un sistema para responder una sola pregunta, todos los días.",
		quote: "¿Cuánto puedo gastar hoy sin arruinar mi mes?",
		cta: "Cómo funciona",
		ctaAction: "next",
		signInLink: true,
	},
	{
		eyebrow: "LOS TRES SOBRES",
		title: "Todo lo que entra se reparte apenas llega.",
		segmentBar: true,
		segments: [
			{ label: "Necesidades", pct: "50%", color: "needs" },
			{ label: "Gustos", pct: "30%", color: "wants" },
			{ label: "Ahorro", pct: "20%", color: "savings" },
		],
		segmentNote: "Los porcentajes son tuyos: puedes cambiarlos cuando quieras.",
		cta: "Siguiente",
		ctaAction: "next",
	},
	{
		eyebrow: "CICLOS Y DISPONIBLE DIARIO",
		title: "Cada día, un número. Ese es todo el trabajo.",
		body: "Quipu resta tus compromisos y tu ahorro, divide lo que queda entre los días del ciclo y te dice cuánto puedes gastar hoy.",
		dailyCard: { label: "PUEDES GASTAR HOY", value: "S/ 42.30" },
		rules: [
			"Si gastas de más, mañana baja.",
			"Si gastas de menos, mañana sube.",
			"Tu ahorro no se toca.",
		],
		cta: "Crear mi cuenta",
		ctaAction: "sign-up",
	},
];
