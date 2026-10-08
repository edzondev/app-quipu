import { describe, expect, it } from "vitest";
import { assertContributionConservation } from "./spaceContributionsLogic";

describe("spaceContributions conservation", () => {
	it("conserves cents across personal debit and space credit", () => {
		expect(
			assertContributionConservation({
				personalBefore: 100_000,
				personalAfter: 70_000,
				spaceBefore: 0,
				spaceAfter: 30_000,
				amountCents: 30_000,
			}),
		).toBe(true);
	});

	it("fails when personal debit does not match amount", () => {
		expect(
			assertContributionConservation({
				personalBefore: 100_000,
				personalAfter: 80_000,
				spaceBefore: 0,
				spaceAfter: 30_000,
				amountCents: 30_000,
			}),
		).toBe(false);
	});
});
