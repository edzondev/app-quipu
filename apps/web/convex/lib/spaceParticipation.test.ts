import { describe, expect, it } from "vitest";
import {
	computeMemberParticipationCents,
	partitionParticipationSources,
} from "./spaceParticipation";

describe("spaceParticipation", () => {
	it("sums explicit transfers and personal_pocket contributions", () => {
		const total = computeMemberParticipationCents([
			{ kind: "explicit_transfer", amountCents: 50_000 },
			{ kind: "expense_paid_personally", amountCents: 12_500 },
		]);
		expect(total).toBe(62_500);
	});

	it("ignores non-participation rows", () => {
		const total = computeMemberParticipationCents([
			{ kind: "explicit_transfer", amountCents: 30_000 },
		]);
		expect(total).toBe(30_000);
	});

	it("partitions contribution kinds without double counting", () => {
		const parts = partitionParticipationSources([
			{
				kind: "explicit_transfer",
				amountCents: 10_000,
				linkedSpaceExpenseId: undefined,
			},
			{
				kind: "expense_paid_personally",
				amountCents: 5_000,
				linkedSpaceExpenseId: "exp1" as never,
			},
		]);
		expect(parts.explicitCents).toBe(10_000);
		expect(parts.personalPocketCents).toBe(5_000);
	});
});
