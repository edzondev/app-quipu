import { describe, expect, it } from "vitest";
import {
	buildCycleSavingsContextLabel,
	computeCycleSavingsBreakdown,
	computeObjectiveAdditionalBarPercents,
	computeObjectiveProgressPercent,
	computeSavingsSetAsideCents,
	countsTowardSavingsObjective,
} from "./cycleSavingsBreakdown";

describe("countsTowardSavingsObjective", () => {
	it("treats absent policy as habitual objective", () => {
		expect(countsTowardSavingsObjective(undefined)).toBe(true);
	});

	it("treats profile_default as objective", () => {
		expect(countsTowardSavingsObjective("profile_default")).toBe(true);
	});

	it("excludes all_to_savings from objective policy flag", () => {
		expect(countsTowardSavingsObjective("all_to_savings")).toBe(false);
	});
});

describe("computeCycleSavingsBreakdown", () => {
	it("returns zeros with no inputs", () => {
		expect(
			computeCycleSavingsBreakdown({
				incomeEvents: [],
				surplusContributions: [],
			}),
		).toMatchObject({
			savingsObjectiveTargetCents: 0,
			savingsObjectiveContributedCents: 0,
			savingsAdditionalCents: 0,
			savingsCycleContributedCents: 0,
			savingsObjectiveCents: 0,
			savingsTotalCents: 0,
			status: "on_track",
		});
	});

	it("does not treat envelope remaining or unspent needs as additional", () => {
		const result = computeCycleSavingsBreakdown({
			incomeEvents: [
				{
					distributionApplied: {
						needs: 100_000,
						wants: 50_000,
						savings: 99_080,
					},
					distributionPolicy: "profile_default",
				},
			],
			surplusContributions: [],
			allocationLines: [],
			savingsEnvelope: {
				allocatedAmount: 99_080,
				remainingAmount: 99_080,
			},
		});
		expect(result.savingsObjectiveTargetCents).toBe(99_080);
		expect(result.savingsObjectiveContributedCents).toBe(0);
		expect(result.savingsAdditionalCents).toBe(0);
		expect(result.savingsCycleContributedCents).toBe(0);
	});

	it("does not treat all_to_savings as automatic additional", () => {
		const result = computeCycleSavingsBreakdown({
			incomeEvents: [
				{
					incomeKind: "extraordinary",
					distributionApplied: { needs: 0, wants: 0, savings: 50_000 },
					distributionPolicy: "all_to_savings",
				},
				{
					distributionApplied: { needs: 400, wants: 240, savings: 160 },
					distributionPolicy: "profile_default",
				},
			],
			surplusContributions: [],
			savingsEnvelope: {
				allocatedAmount: 50_160,
				remainingAmount: 50_160,
			},
		});
		expect(result.savingsAdditionalCents).toBe(0);
		expect(result.savingsObjectiveTargetCents).toBe(50_160);
		expect(result.savingsCycleContributedCents).toBe(0);
	});

	it("counts confirmed additional surplus only when persisted", () => {
		const result = computeCycleSavingsBreakdown({
			incomeEvents: [],
			surplusContributions: [{ amount: 68_567, contributionKind: "additional" }],
			allocationLines: [
				{
					destination: "savings_contribution",
					amountCents: 50_000,
					contributionKind: "objective",
				},
			],
			savingsEnvelope: { allocatedAmount: 50_000, remainingAmount: 0 },
		});
		expect(result.savingsObjectiveContributedCents).toBe(50_000);
		expect(result.savingsAdditionalCents).toBe(68_567);
		expect(result.savingsCycleContributedCents).toBe(118_567);
		expect(result.status).toBe("above_objective");
	});

	it("without contribution facts, objective contributed is 0 (no set-aside invent)", () => {
		const result = computeCycleSavingsBreakdown({
			incomeEvents: [
				{
					distributionApplied: {
						needs: 3_256_67,
						wants: 1_954_00,
						savings: 814_33,
					},
					distributionPolicy: "profile_default",
				},
			],
			surplusContributions: [],
			savingsEnvelope: {
				allocatedAmount: 814_33,
				remainingAmount: 0,
			},
		});
		expect(result.savingsObjectiveTargetCents).toBe(814_33);
		expect(result.savingsObjectiveContributedCents).toBe(0);
		expect(result.savingsAdditionalCents).toBe(0);
		expect(result.savingsCycleContributedCents).toBe(0);
		expect(result.status).toBe("below_objective");
	});

	it("marks below_objective when contributed is under target", () => {
		const result = computeCycleSavingsBreakdown({
			incomeEvents: [
				{
					distributionApplied: {
						needs: 3_256_67,
						wants: 1_954_00,
						savings: 814_33,
					},
					distributionPolicy: "profile_default",
				},
			],
			surplusContributions: [],
			allocationLines: [
				{
					destination: "savings_contribution",
					amountCents: 414_33,
					contributionKind: "objective",
				},
			],
			savingsEnvelope: {
				allocatedAmount: 814_33,
				remainingAmount: 400_00,
			},
		});
		expect(result.savingsObjectiveContributedCents).toBe(414_33);
		expect(result.status).toBe("below_objective");
	});
});

describe("helpers", () => {
	it("computeSavingsSetAsideCents", () => {
		expect(
			computeSavingsSetAsideCents({
				allocatedAmount: 100,
				remainingAmount: 40,
			}),
		).toBe(60);
	});

	it("computeObjectiveProgressPercent caps at 100", () => {
		expect(computeObjectiveProgressPercent(200, 100)).toBe(100);
		expect(computeObjectiveProgressPercent(50, 100)).toBe(50);
	});

	it("computeObjectiveAdditionalBarPercents", () => {
		expect(computeObjectiveAdditionalBarPercents(40, 100)).toEqual({
			objectiveBarPercent: 40,
			additionalBarPercent: 60,
		});
	});

	it("buildCycleSavingsContextLabel", () => {
		const label = buildCycleSavingsContextLabel(Date.UTC(2026, 6, 1), [
			{ distributionApplied: { needs: 1, wants: 1, savings: 1 } },
		]);
		expect(label).toMatch(/· sueldo$/);
	});
});
