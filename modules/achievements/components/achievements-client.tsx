"use client";

import { api } from "@/convex/_generated/api";
import { usePlan } from "@/hooks/use-plan";
import { Preloaded, usePreloadedQuery } from "convex/react";
import { Crown, Trophy } from "lucide-react";
import AchievementCard from "./achievement-card";
import StreakBanner from "./streak-banner";

type Props = {
  preloaded: Preloaded<typeof api.streaks.getAchievementsData>;
};

export default function AchievementsClient({ preloaded }: Props) {
  const data = usePreloadedQuery(preloaded);
  const { isPremium } = usePlan();

  if (!data) return null;

  const { streak, achievements } = data;

  const unlocked = achievements.filter((a) => a.unlocked);
  const lockedFree = achievements.filter(
    (a) => !a.unlocked && a.tier === "free",
  );
  const lockedPremium = achievements.filter(
    (a) => !a.unlocked && a.tier === "premium",
  );

  return (
    <>
      <StreakBanner
        currentStreak={streak?.currentStreak ?? 0}
        longestStreak={streak?.longestStreak ?? 0}
      />

      {/* Unlocked achievements */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-5 h-5 text-teal-600" />
          <h2 className="font-semibold text-base">
            Desbloqueados ({unlocked.length})
          </h2>
        </div>
        {unlocked.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aún no has desbloqueado ningún logro. ¡Sigue así!
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {unlocked.map((a) => (
              <AchievementCard
                key={a.achievementId}
                achievement={a}
                isPremium={isPremium}
              />
            ))}
          </div>
        )}
      </section>

      {/* Locked free achievements */}
      {lockedFree.length > 0 ? (
        <section className="mb-8">
          <h2 className="font-semibold text-base mb-4">
            Por desbloquear ({lockedFree.length})
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {lockedFree.map((a) => (
              <AchievementCard
                key={a.achievementId}
                achievement={a}
                isPremium={isPremium}
              />
            ))}
          </div>
        </section>
      ) : null}

      {/* Locked premium achievements */}
      {lockedPremium.length > 0 ? (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Crown className="w-5 h-5 text-amber-400" />
            <h2 className="font-semibold text-base">
              Logros Premium ({lockedPremium.length})
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {lockedPremium.map((a) => (
              <AchievementCard
                key={a.achievementId}
                achievement={a}
                isPremium={isPremium}
              />
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}
