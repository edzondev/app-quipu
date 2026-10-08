export const ENVELOPE_LABELS = {
	needs: "Necesidades",
	wants: "Gustos",
	savings: "Ahorro",
} as const;

export type EnvelopeKey = "allocationNeeds" | "allocationWants" | "allocationSavings";

export const ENVELOPES: {
	key: EnvelopeKey;
	label: string;
	desc: string;
	barColor: string;
}[] = [
	{
		key: "allocationNeeds",
		label: "Necesidades",
		desc: "Alquiler, servicios, comida",
		barColor: "bg-needs",
	},
	{
		key: "allocationWants",
		label: "Gustos",
		desc: "Salidas, antojos, suscripciones",
		barColor: "bg-clay",
	},
	{
		key: "allocationSavings",
		label: "Ahorro",
		desc: "Fondo de emergencia y metas",
		barColor: "bg-moss",
	},
];
