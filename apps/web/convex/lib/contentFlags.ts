/** Heurísticas conservadoras para cola de revisión manual (sin auto-ban). */

export type ContentFlagMatch = {
	term: string;
	snippet: string;
	severity: "low" | "medium" | "high";
};

const REVIEW_TERMS: Array<{
	term: string;
	severity: ContentFlagMatch["severity"];
}> = [
	{ term: "extorsion", severity: "high" },
	{ term: "extorsión", severity: "high" },
	{ term: "cobro de cupo", severity: "high" },
	{ term: "vacuna", severity: "medium" },
	{ term: "narco", severity: "high" },
	{ term: "sicario", severity: "high" },
	{ term: "lavado", severity: "medium" },
];

function normalizeText(value: string): string {
	return value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

export function scanTextForContentFlags(text: string): ContentFlagMatch[] {
	const normalized = normalizeText(text);
	if (!normalized.trim()) return [];

	const matches: ContentFlagMatch[] = [];
	for (const { term, severity } of REVIEW_TERMS) {
		const normalizedTerm = normalizeText(term);
		if (!normalized.includes(normalizedTerm)) continue;
		const index = normalized.indexOf(normalizedTerm);
		const start = Math.max(0, index - 20);
		const end = Math.min(text.length, index + normalizedTerm.length + 20);
		matches.push({
			term,
			snippet: text.slice(start, end).trim(),
			severity,
		});
	}
	return matches;
}

export function scanTextsForContentFlags(
	texts: Array<string | undefined | null>,
): ContentFlagMatch[] {
	const all: ContentFlagMatch[] = [];
	for (const text of texts) {
		if (!text) continue;
		all.push(...scanTextForContentFlags(text));
	}
	return all;
}

export function highestSeverity(matches: ContentFlagMatch[]): ContentFlagMatch["severity"] | null {
	if (matches.length === 0) return null;
	if (matches.some((m) => m.severity === "high")) return "high";
	if (matches.some((m) => m.severity === "medium")) return "medium";
	return "low";
}
