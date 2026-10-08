/** Validates cent conservation for explicit space contributions. */
export function assertContributionConservation(input: {
	personalBefore: number;
	personalAfter: number;
	spaceBefore: number;
	spaceAfter: number;
	amountCents: number;
}): boolean {
	const personalDelta = input.personalBefore - input.personalAfter;
	const spaceDelta = input.spaceAfter - input.spaceBefore;
	return personalDelta === input.amountCents && spaceDelta === input.amountCents;
}
