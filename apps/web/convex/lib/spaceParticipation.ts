import type { Doc } from "../_generated/dataModel";

export type ParticipationContribution = Pick<Doc<"spaceContributions">, "kind" | "amountCents">;

/** Participation = explicit contributions + personal_pocket contribution rows. */
export function computeMemberParticipationCents(
	contributions: ReadonlyArray<ParticipationContribution>,
): number {
	return contributions.reduce((sum, row) => {
		if (row.kind === "explicit_transfer" || row.kind === "expense_paid_personally") {
			return sum + row.amountCents;
		}
		return sum;
	}, 0);
}

/** Avoid double-counting when expense already has a linked contribution row. */
export function partitionParticipationSources(
	contributions: ReadonlyArray<
		Pick<Doc<"spaceContributions">, "kind" | "amountCents" | "linkedSpaceExpenseId">
	>,
): { explicitCents: number; personalPocketCents: number } {
	let explicitCents = 0;
	let personalPocketCents = 0;
	for (const row of contributions) {
		if (row.kind === "explicit_transfer") {
			explicitCents += row.amountCents;
		} else if (row.kind === "expense_paid_personally") {
			personalPocketCents += row.amountCents;
		}
	}
	return { explicitCents, personalPocketCents };
}
