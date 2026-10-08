import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { loadCycleCoverageById } from "./loadCycleCoverageContext";

export async function clearCommitmentCoverageForProfile(
	ctx: MutationCtx,
	profileId: Id<"profiles">,
) {
	const commitments = await ctx.db
		.query("fixedCommitments")
		.withIndex("by_profileId", (q) => q.eq("profileId", profileId))
		.collect();

	await Promise.all(
		commitments.map((commitment) =>
			ctx.db.patch(commitment._id, {
				coveredAt: undefined,
				coveredBy: undefined,
			}),
		),
	);
}

export async function evaluateCommitmentCoverageForCycle(
	ctx: MutationCtx,
	profileId: Id<"profiles">,
	cycleId: Id<"financialCycles">,
	now: number,
) {
	const coverageContext = await loadCycleCoverageById(ctx, profileId, cycleId, now);
	if (!coverageContext) return;

	const { commitments, coverageById } = coverageContext;

	await Promise.all(
		commitments.map((commitment) => {
			const coverage = coverageById.get(commitment._id);
			if (!coverage) return Promise.resolve();

			if (coverage.status === "covered") {
				const coveredBy: Id<"incomeEvents">[] = [];
				for (const funding of coverage.fundingEvents) {
					const eventId = funding.eventId;
					if (!eventId.startsWith("__boost_") && !eventId.startsWith("__reservation_")) {
						coveredBy.push(eventId as Id<"incomeEvents">);
					}
				}

				if (commitment.postponedForCycleId === cycleId) {
					return ctx.db.patch(commitment._id, {
						coveredAt: commitment.coveredAt ?? now,
						coveredBy: [],
					});
				}

				return ctx.db.patch(commitment._id, {
					coveredAt: commitment.coveredAt ?? now,
					coveredBy,
				});
			}

			return ctx.db.patch(commitment._id, {
				coveredAt: undefined,
				coveredBy: undefined,
			});
		}),
	);
}
