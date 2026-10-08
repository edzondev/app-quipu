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
