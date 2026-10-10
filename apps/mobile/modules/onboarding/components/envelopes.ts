import type { EnvelopeKey } from "@/shared/lib/onboarding/types";

export const ENVELOPE_BG: Record<EnvelopeKey, string> = {
	needs: "bg-needs",
	wants: "bg-wants",
	savings: "bg-savings",
};

export const ENVELOPE_LABELS: Record<EnvelopeKey, string> = {
	needs: "Necesidades",
	wants: "Gustos",
	savings: "Ahorro",
};

export const ENVELOPE_HINT: Record<EnvelopeKey, string> = {
	needs: "Renta, comida, transporte y servicios: lo que sostiene tu mes.",
	wants: "Salidas, compras y antojos: lo que disfrutas sin culpa.",
	savings: "Lo que queda. Se aparta primero, antes de gastar.",
};
