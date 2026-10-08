import { z } from "zod";
import { DEFAULT_MARKET, SUPPORTED_MARKETS } from "@/core/constants";

const currencyCodes = SUPPORTED_MARKETS.map((m) => m.currencyCode) as ["PEN", "EUR", "USD"];

export const finalPayloadSchema = z
	.object({
		name: z.string().optional(),
		country: z.string().default(DEFAULT_MARKET.country),
		currencyCode: z.enum(currencyCodes).default(DEFAULT_MARKET.currencyCode),
		currencySymbol: z.string().default(DEFAULT_MARKET.currencySymbol),
		incomeModel: z.enum(["fixed", "variable", "mixed"]),
		payFrequency: z.enum(["monthly", "biweekly"]).optional(),
		paydays: z.array(z.number().int().min(1).max(31)).optional(),
		cycleDurationDays: z.union([z.literal(15), z.literal(30)]).optional(),
		mixedFixedAmount: z.number().int().min(0).optional(),
		variableIncomeSources: z.array(z.string().trim().min(1).max(30)).optional(),
		allocationNeeds: z.number().int().min(0).max(100),
		allocationWants: z.number().int().min(0).max(100),
		allocationSavings: z.number().int().min(0).max(100),
	})
	.refine((data) => data.allocationNeeds + data.allocationWants + data.allocationSavings === 100, {
		message: "El reparto debe sumar exactamente 100%.",
		path: ["allocations"],
	})
	.superRefine((data, ctx) => {
		if (data.incomeModel === "variable") {
			if (data.cycleDurationDays == null) {
				ctx.addIssue({
					code: "custom",
					path: ["cycleDurationDays"],
					message: "Para ingresos variables, elige un ciclo de 15 o 30 días.",
				});
			}
			if (data.payFrequency !== undefined) {
				ctx.addIssue({
					code: "custom",
					path: ["payFrequency"],
					message: "Para ingresos variables, payFrequency no aplica.",
				});
			}
			return;
		}

		// fixed | mixed: frecuencia y días son obligatorios (alineado con createProfile).
		if (!data.payFrequency) {
			ctx.addIssue({
				code: "custom",
				path: ["payFrequency"],
				message: "Para ingresos fijos o mixtos, payFrequency y paydays son obligatorios.",
			});
		}
		if (!data.paydays || data.paydays.length === 0) {
			ctx.addIssue({
				code: "custom",
				path: ["paydays"],
				message: "Para ingresos fijos o mixtos, payFrequency y paydays son obligatorios.",
			});
		}
	});
