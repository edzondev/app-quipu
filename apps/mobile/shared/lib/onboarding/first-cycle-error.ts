import type { CycleField } from "@/shared/lib/onboarding/types";

const CYCLE_ERROR = "No se pudo abrir tu ciclo. Intenta de nuevo.";

const CYCLE_FIELDS = [
	"openingBalanceCents",
	"nextPayDate",
] as const satisfies readonly CycleField[];

export type FirstCycleFailure =
	| { code: "ALREADY_EXISTS" }
	| { code: "VALIDATION_ERROR"; field: CycleField; message: string }
	| { code: "OTHER"; message: string };

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function isCycleField(value: unknown): value is CycleField {
	return CYCLE_FIELDS.some((field) => field === value);
}

export function readFirstCycleError(error: unknown): FirstCycleFailure {
	const data = isRecord(error) && "data" in error ? error.data : undefined;
	if (!isRecord(data) || typeof data.code !== "string") {
		return { code: "OTHER", message: CYCLE_ERROR };
	}
	if (data.code === "ALREADY_EXISTS") return { code: "ALREADY_EXISTS" };
	if (data.code === "VALIDATION_ERROR") {
		const nested = isRecord(data.data) ? data.data : undefined;
		const message =
			typeof data.message === "string" && data.message.trim() ? data.message : CYCLE_ERROR;
		if (isCycleField(nested?.field)) {
			return { code: "VALIDATION_ERROR", field: nested.field, message };
		}
	}
	return { code: "OTHER", message: CYCLE_ERROR };
}
