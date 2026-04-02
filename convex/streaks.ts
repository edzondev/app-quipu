import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import { getProfile, getProfileOrThrow, currentMonthString } from "./helpers";
import type { Id } from "./_generated/dataModel";

// ─── Achievement Catalog ───────────────────────────────────────────────────────

export const ACHIEVEMENT_CATALOG = [
  // ── Free tier: the 3 initial badges ─────────────────────────────────────────
  {
    achievementId: "first_expense",
    title: "Primer Paso",
    description: "Registra tu primer gasto",
    icon: "📝",
    category: "milestone",
    tier: "free",
  },
  {
    achievementId: "expenses_10",
    title: "Registrador Activo",
    description: "Registra 10 gastos",
    icon: "🔢",
    category: "milestone",
    tier: "free",
  },
  {
    achievementId: "first_savings",
    title: "Primer Ahorro",
    description: "Realiza tu primera asignación al ahorro",
    icon: "💰",
    category: "savings",
    tier: "free",
  },
  // ── Premium tier: advanced badges & streaks ──────────────────────────────────
  {
    achievementId: "emergency_25",
    title: "Red de Seguridad",
    description: "Fondo de emergencia al 25%",
    icon: "🛡️",
    category: "savings",
    tier: "premium",
  },
  {
    achievementId: "emergency_50",
    title: "Medio Camino",
    description: "Fondo de emergencia al 50%",
    icon: "⚡",
    category: "savings",
    tier: "premium",
  },
  {
    achievementId: "emergency_75",
    title: "Casi Blindado",
    description: "Fondo de emergencia al 75%",
    icon: "🏰",
    category: "savings",
    tier: "premium",
  },
  {
    achievementId: "emergency_100",
    title: "Blindaje Total",
    description: "Fondo de emergencia al 100%",
    icon: "🏆",
    category: "savings",
    tier: "premium",
  },
  {
    achievementId: "perfect_week",
    title: "Semana Perfecta",
    description: "Una semana sin exceder el presupuesto",
    icon: "✅",
    category: "streak",
    tier: "premium",
  },
  {
    achievementId: "streak_1",
    title: "Mes Completo",
    description: "Un mes completo dentro del presupuesto",
    icon: "📅",
    category: "streak",
    tier: "premium",
  },
  {
    achievementId: "streak_3",
    title: "Racha Imparable",
    description: "3 meses consecutivos cumpliendo el plan",
    icon: "🔥",
    category: "streak",
    tier: "premium",
  },
] as const;

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

export const getAchievementsData = query({
  args: {},
  handler: async (ctx) => {
    const profile = await getProfile(ctx);
    if (!profile) return null;

    const streak = await ctx.db
      .query("streaks")
      .withIndex("by_profileId", (q) => q.eq("profileId", profile._id))
      .unique();

    const dbAchievements = await ctx.db
      .query("achievements")
      .withIndex("by_profileId", (q) => q.eq("profileId", profile._id))
      .collect();

    const unlockedMap = new Map(
      dbAchievements.map((a) => [a.achievementId, a]),
    );

    const achievements = ACHIEVEMENT_CATALOG.map((item) => {
      const db = unlockedMap.get(item.achievementId);
      return {
        achievementId: item.achievementId,
        title: item.title,
        description: item.description,
        icon: item.icon,
        category: item.category,
        tier: item.tier,
        unlocked: !!db,
        unlockedAt: db?.unlockedAt,
      };
    });

    return {
      streak: streak
        ? {
            currentStreak: streak.currentStreak,
            longestStreak: streak.longestStreak,
          }
        : null,
      achievements,
    };
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
  args: {
    profileId: v.id("profiles"),
    allocatedNeeds: v.number(),
    allocatedWants: v.number(),
  },
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

    // Calculate compliance against the amounts passed when processPayday ran
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

    const compliant =
      spentNeeds <= args.allocatedNeeds && spentWants <= args.allocatedWants;

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
      await unlockStreakAchievements(
        ctx as MutationCtx,
        args.profileId,
        newStreak,
      );
    } else {
      await ctx.db.patch(streak._id, { currentStreak: 0 });
    }

    return null;
  },
});

// ─── Exported helpers ─────────────────────────────────────────────────────────

export async function unlockExpenseAchievements(
  ctx: MutationCtx,
  profileId: Id<"profiles">,
  totalCount: number,
) {
  const toCheck = [
    {
      count: 1,
      achievementId: "first_expense",
      title: "Primer Paso",
      description: "Registra tu primer gasto",
      icon: "📝",
      category: "milestone" as const,
    },
    {
      count: 10,
      achievementId: "expenses_10",
      title: "Registrador Activo",
      description: "Registra 10 gastos",
      icon: "🔢",
      category: "milestone" as const,
    },
  ];

  for (const item of toCheck) {
    if (totalCount < item.count) continue;
    const existing = await ctx.db
      .query("achievements")
      .withIndex("by_profileId_achievementId", (q) =>
        q.eq("profileId", profileId).eq("achievementId", item.achievementId),
      )
      .unique();
    if (existing) continue;
    await ctx.db.insert("achievements", {
      profileId,
      achievementId: item.achievementId,
      title: item.title,
      description: item.description,
      icon: item.icon,
      category: item.category,
      unlockedAt: new Date().toISOString().slice(0, 10),
    });
  }
}

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
      title: "Mes Completo",
      description: "Un mes completo dentro del presupuesto",
      icon: "📅",
    },
    3: {
      achievementId: "streak_3",
      title: "Racha Imparable",
      description: "3 meses consecutivos cumpliendo el plan",
      icon: "🔥",
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
      q.eq("profileId", profileId).eq("achievementId", milestone.achievementId),
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
