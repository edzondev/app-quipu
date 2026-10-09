import type { api } from "@quipu/convex-api";
import type { FunctionArgs } from "convex/server";

type CreateIncomeEventArgs = FunctionArgs<typeof api.incomeEvents.createIncomeEvent>;
type ExtraordinaryType = NonNullable<CreateIncomeEventArgs["extraordinaryType"]>;
type DistributionPolicy = NonNullable<CreateIncomeEventArgs["distributionPolicy"]>;
type IncomeSource = CreateIncomeEventArgs["source"];

const EXTRAORDINARY_TYPES = {
	gratification_july: true,
	gratification_december: true,
	cts: true,
	corporate_bonus: true,
	profit_sharing: true,
	custom: true,
} as const satisfies Record<ExtraordinaryType, true>;

const DISTRIBUTION_POLICIES = {
	profile_default: true,
	all_to_savings: true,
} as const satisfies Record<DistributionPolicy, true>;

const SOURCES = {
	payroll: true,
	freelance: true,
	business: true,
	gift: true,
	refund: true,
	investment: true,
	other: true,
} as const satisfies Record<IncomeSource, true>;

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

/** Falla en runtime si el payload no cumple los args inferidos de createIncomeEvent. */
export function assertCreateIncomeEventArgs(
	value: unknown,
): asserts value is CreateIncomeEventArgs {
	if (!isRecord(value)) throw new Error("createIncomeEvent: args no es un objeto");
	if (typeof value.amount !== "number" || !Number.isInteger(value.amount) || value.amount <= 0) {
		throw new Error("createIncomeEvent: amount");
	}
	if (typeof value.source !== "string" || !(value.source in SOURCES)) {
		throw new Error("createIncomeEvent: source");
	}
	if (typeof value.description !== "string") throw new Error("createIncomeEvent: description");
	if (typeof value.occurredAt !== "number") throw new Error("createIncomeEvent: occurredAt");
	if (value.incomeKind !== "habitual" && value.incomeKind !== "extraordinary") {
		throw new Error("createIncomeEvent: incomeKind");
	}
	if (value.incomeKind === "habitual") {
		if (
			"extraordinaryType" in value ||
			"distributionPolicy" in value ||
			"extraordinaryLabel" in value
		) {
			throw new Error("createIncomeEvent: el sueldo no lleva campos extraordinarios");
		}
		return;
	}
	if (
		typeof value.extraordinaryType !== "string" ||
		!(value.extraordinaryType in EXTRAORDINARY_TYPES)
	) {
		throw new Error("createIncomeEvent: falta extraordinaryType");
	}
	if (value.extraordinaryType === "custom") {
		if (
			typeof value.extraordinaryLabel !== "string" ||
			value.extraordinaryLabel.trim().length === 0
		) {
			throw new Error("createIncomeEvent: falta extraordinaryLabel");
		}
	} else if ("extraordinaryLabel" in value) {
		// Convex: «La etiqueta personalizada solo aplica a "Otro extraordinario"».
		throw new Error("createIncomeEvent: extraordinaryLabel solo aplica a custom");
	}
	if (
		typeof value.distributionPolicy !== "string" ||
		!(value.distributionPolicy in DISTRIBUTION_POLICIES)
	) {
		throw new Error("createIncomeEvent: falta distributionPolicy");
	}
}
