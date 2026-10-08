import { describe, expect, it } from "vitest";
import { buildCrisisPlan, computeProjectedCushion } from "./crisisPlan";
import type { CrisisCommitmentSlice } from "./crisisResolution";

const cycleEndDate = new Date("2026-07-30T12:00:00-05:00").getTime();

const baseCommitments: CrisisCommitmentSlice[] = [
	{
		id: "rent",
		name: "Alquiler",
		amount: 120_000,
		remaining: 120_000,
		envelope: "needs",
		dueDay: 5,
	},
	{
		id: "netflix",
		name: "Netflix",
		amount: 4_500,
		remaining: 4_500,
		envelope: "wants",
		dueDay: 20,
	},
];

describe("buildCrisisPlan", () => {
	it("builds cover without rescue when savings fund remaining needs", () => {
		const plan = buildCrisisPlan({
			commitments: baseCommitments,
			savingsRemaining: 120_000,
			wantsRemaining: 10_000,
			needsRemaining: 0,
			cycleEndDate,
		});

		expect(plan).not.toBeNull();
		expect(plan?.steps.map((step) => step.kind)).toEqual(["postpone", "cover_from_savings"]);
		expect(plan?.canFullyResolve).toBe(true);
	});

	it("builds rescue-only plan when wants is in deficit and commitments are covered", () => {
		const plan = buildCrisisPlan({
			commitments: [
				{
					id: "spotify",
					name: "Spotify",
					amount: 2_400,
					remaining: 0,
					envelope: "wants",
					dueDay: 18,
				},
			],
			savingsRemaining: 15_000,
			wantsRemaining: -12_000,
			needsRemaining: 30_000,
			cycleEndDate,
		});

		expect(plan).not.toBeNull();
		expect(plan?.steps.map((step) => step.kind)).toEqual(["rescue_transfer", "freeze_wants"]);
		expect(plan?.steps[0]?.rescueTransfer).toBe(12_000);
	});

	it("combines postpone, cover and freeze for a mixed crisis", () => {
		const plan = buildCrisisPlan({
			commitments: baseCommitments,
			savingsRemaining: 120_000,
			wantsRemaining: -5_000,
			needsRemaining: 0,
			cycleEndDate,
		});

		expect(plan).not.toBeNull();
		expect(plan?.steps.map((step) => step.kind)).toEqual([
			"postpone",
			"cover_from_savings",
			"freeze_wants",
		]);
		expect(plan?.steps[0]?.commitmentId).toBe("netflix");
		expect(plan?.steps[0]?.label).toContain("Netflix");
		expect(plan?.steps.some((step) => step.kind === "rescue_transfer")).toBe(false);
	});

	it("returns partial plan when savings cannot fully cover remaining gap", () => {
		const plan = buildCrisisPlan({
			commitments: baseCommitments,
			savingsRemaining: 20_000,
			wantsRemaining: 0,
			needsRemaining: 0,
			cycleEndDate,
		});

		expect(plan).not.toBeNull();
		expect(plan?.canFullyResolve).toBe(false);
		expect(plan?.outcomeLabel).toContain("aún faltan");
	});

	it("returns null when there is no crisis to resolve", () => {
		expect(
			buildCrisisPlan({
				commitments: baseCommitments.map((commitment) => ({
					...commitment,
					remaining: 0,
				})),
				savingsRemaining: 50_000,
				wantsRemaining: 20_000,
				needsRemaining: 10_000,
				cycleEndDate,
			}),
		).toBeNull();
	});
});

describe("computeProjectedCushion", () => {
	it("subtracts uncovered commitments from positive envelope balances", () => {
		expect(
			computeProjectedCushion({
				savingsRemaining: 8_000,
				needsRemaining: 5_000,
				wantsRemaining: 2_000,
				uncoveredTotal: 7_000,
			}),
		).toBe(8_000);
	});
});
