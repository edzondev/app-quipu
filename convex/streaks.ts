import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import { getProfile, getProfileOrThrow, currentMonthString } from "./helpers";
import type { Id } from "./_generated/dataModel";

// ─── Queries ──────────────────────────────────────────────────────────────────

export const getStreakData = query({
  args: {},
  handler: async (ctx) => {
    const profile = await getProfile(ctx);
    if (!profile) return null;

    const streak = await ctx.db
      .query("streaks")
      .withIndex("by_profileId", (q) => q.eq("profileId", profile._id))
      .unique();

    const history = await ctx.db
      .query("streakMonthlyHistory")
      .withIndex("by_profileId", (q) => q.eq("profileId", profile._id))
      .order("desc")
      .take(12);

    return { streak, history };
  },
});

export const getAchievements = query({
  args: {},
  handler: async (ctx) => {
    const profile = await getProfile(ctx);
    if (!profile) return null;
    return await ctx.db
      .query("achievements")
      .withIndex("by_profileId", (q) => q.eq("profileId", profile._id))
      .collect();
  },
});

// ─── Internal Mutations ────────────────────────────────────────────────────────

/**
 * Evaluates whether the closing month was "compliant":
 *   compliant = spentNeeds ≤ allocatedNeeds AND spentWants ≤ allocatedWants
 *
 * Called by the scheduler at the end of each month (triggered from processPayday).
 * Updates the streak record and unlocks achievements.
 */
export const evaluateMonthCompliance = internalMutation({
  args: { profileId: v.id("profiles") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const profile = await ctx.db.get(args.profileId);
    if (!profile) return null;

    const month = currentMonthString();

    // Avoid double-evaluation for the same month
    const existing = await ctx.db
      .query("streakMonthlyHistory")
      .withIndex("by_profileId_month", (q) =>
        q.eq("profileId", args.profileId).eq("month", month),
      )
      .unique();

    if (existing) return null;

    // Calculate compliance
    const expenses = await ctx.db
      .query("expenses")
      .withIndex("by_profileId", (q) => q.eq("profileId", args.profileId))
      .collect();

    const monthExpenses = expenses.filter((e) => e.date.startsWith(month));
    const spentNeeds = monthExpenses
      .filter((e) => e.envelope === "needs")
      .reduce((sum, e) => sum + e.amount, 0);
    const spentWants = monthExpenses
      .filter((e) => e.envelope === "wants")
      .reduce((sum, e) => sum + e.amount, 0);

    const commitments = await ctx.db
      .query("fixedCommitments")
      .withIndex("by_profileId", (q) => q.eq("profileId", args.profileId))
      .collect();

    const totalFixed = commitments.reduce((sum, c) => sum + c.amount, 0);
    const netIncome = profile.monthlyIncome - totalFixed;

    const allocatedNeeds = netIncome * (profile.allocationNeeds / 100);
    const allocatedWants = netIncome * (profile.allocationWants / 100);

    const compliant = spentNeeds <= allocatedNeeds && spentWants <= allocatedWants;

    // Record history
    await ctx.db.insert("streakMonthlyHistory", {
      profileId: args.profileId,
      month,
      compliant,
    });

    // Update streak
    const streak = await ctx.db
      .query("streaks")
      .withIndex("by_profileId", (q) => q.eq("profileId", args.profileId))
      .unique();

    if (!streak) return null;

    if (compliant) {
      const newStreak = streak.currentStreak + 1;
      await ctx.db.patch(streak._id, {
        currentStreak: newStreak,
        longestStreak: Math.max(newStreak, streak.longestStreak),
        lastComplianceDate: month,
      });
      // Check for streak achievements
      await unlockStreakAchievements(ctx as MutationCtx, args.profileId, newStreak);
    } else {
      await ctx.db.patch(streak._id, { currentStreak: 0 });
    }

    return null;
  },
});

// ─── Private helpers ──────────────────────────────────────────────────────────

async function unlockStreakAchievements(
  ctx: MutationCtx,
  profileId: Id<"profiles">,
  streakCount: number,
) {
  // Achievement definitions keyed by streak milestone
  const milestones: Record<
    number,
    { achievementId: string; title: string; description: string; icon: string }
  > = {
    1: {
      achievementId: "streak_1",
      title: "Primer mes",
      description: "Completaste tu primer mes dentro del presupuesto",
      icon: "🌱",
    },
    3: {
      achievementId: "streak_3",
      title: "Tres meses",
      description: "3 meses consecutivos con disciplina",
      icon: "🌿",
    },
    6: {
      achievementId: "streak_6",
      title: "Medio año",
      description: "6 meses seguidos controlando tu dinero",
      icon: "🏆",
    },
    12: {
      achievementId: "streak_12",
      title: "Un año completo",
      description: "12 meses de racha — eres un ejemplo de disciplina",
      icon: "💎",
    },
  };

  const milestone = milestones[streakCount];
  if (!milestone) return;

  // Check if already unlocked
  const existing = await ctx.db
    .query("achievements")
    .withIndex("by_profileId_achievementId", (q) =>
      q
        .eq("profileId", profileId)
        .eq("achievementId", milestone.achievementId),
    )
    .unique();

  if (existing) return;

  await ctx.db.insert("achievements", {
    profileId,
    achievementId: milestone.achievementId,
    title: milestone.title,
    description: milestone.description,
    icon: milestone.icon,
    category: "streak" as const,
    unlockedAt: new Date().toISOString().slice(0, 10),
  });
}
