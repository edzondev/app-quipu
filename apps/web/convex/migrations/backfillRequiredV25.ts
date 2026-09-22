import { internalMutation } from "../_generated/server";

/**
 * One-shot backfill before P0-3 schema narrow.
 * Run once: `npx convex run migrations/backfillRequiredV25:backfillRequiredV25Fields`
 */
export const backfillRequiredV25Fields = internalMutation({
  args: {},
  handler: async (ctx) => {
    const profiles = (await ctx.db.query("profiles").collect()).filter(
      (profile) => profile.incomeModel === undefined,
    );
    const cycles = (await ctx.db.query("financialCycles").collect()).filter(
      (cycle) => cycle.totalIncomeReceived === undefined,
    );
    const commitments = (
      await ctx.db.query("fixedCommitments").collect()
    ).filter((commitment) => commitment.dueDay === undefined);

    await Promise.all([
      ...profiles.map((profile) =>
        ctx.db.patch(profile._id, { incomeModel: "fixed" }),
      ),
      ...cycles.map((cycle) =>
        ctx.db.patch(cycle._id, { totalIncomeReceived: 0 }),
      ),
      ...commitments.map((commitment) =>
        ctx.db.patch(commitment._id, { dueDay: 1 }),
      ),
    ]);

    return {
      profilesPatched: profiles.length,
      cyclesPatched: cycles.length,
      commitmentsPatched: commitments.length,
    };
  },
});
