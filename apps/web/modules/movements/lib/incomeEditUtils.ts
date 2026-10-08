import { getIncomeSourceLabel } from "@/modules/income/constants";
import type { IncomeSource } from "@/modules/income/types";

/**
 * Recovers the user-typed concept from a stored income description.
 *
 * When an income event is created, the description is:
 *   buildIncomeDescription(sourceLabel, concept) = concept.trim() || sourceLabel
 *
 * So: if the stored description equals the source label, the concept was empty.
 * Otherwise, the description IS the concept.
 */
export function extractConcept(description: string, source: IncomeSource): string {
	const sourceLabel = getIncomeSourceLabel(source);
	return description === sourceLabel ? "" : description;
}

/**
 * Determines if a stored income description came from a user-typed concept
 * (as opposed to just the default source label).
 */
export function hasCustomConcept(description: string, source: IncomeSource): boolean {
	return extractConcept(description, source) !== "";
}
