import { PremiumBadge } from "@/core/components/shared/premium-badge";
import { cn } from "@/lib/utils";

type Achievement = {
  achievementId: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  tier: "free" | "premium";
  unlocked: boolean;
  unlockedAt?: string;
};

type Props = {
  achievement: Achievement;
  isPremium: boolean;
};

export default function AchievementCard({ achievement, isPremium }: Props) {
  const { title, description, icon, tier, unlocked, unlockedAt } = achievement;

  const isPremiumAchievement = tier === "premium";
  const isLocked = !unlocked;
  const isLockedPremium = isPremiumAchievement && !isPremium && isLocked;

  if (unlocked) {
    return (
      <div
        className={cn(
          "rounded-xl p-4 flex flex-col gap-2 border",
          isPremiumAchievement
            ? "bg-amber-50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-700"
            : "bg-envelope-savings/5 dark:bg-green-950/20 border-envelope-savings dark:border-green-800",
        )}
      >
        <div className="flex items-start justify-between gap-1">
          <span className="text-3xl">{icon}</span>
          {isPremiumAchievement ? <PremiumBadge size="sm" /> : null}
        </div>
        <div>
          <p className="font-semibold text-sm">{title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>
        {unlockedAt ? (
          <p
            className={cn(
              "text-xs font-medium mt-auto",
              isPremiumAchievement
                ? "text-amber-600 dark:text-amber-400"
                : "text-green-600 dark:text-green-400",
            )}
          >
            {unlockedAt}
          </p>
        ) : null}
      </div>
    );
  }

  // Locked premium achievement for a free user
  if (isLockedPremium) {
    return (
      <div className="rounded-xl bg-amber-50/50 dark:bg-amber-950/10 border border-amber-200 dark:border-amber-800/50 p-4 flex flex-col gap-2">
        <div className="flex items-start justify-between gap-1">
          <span className="text-3xl grayscale opacity-50">{icon}</span>
          <PremiumBadge size="sm" />
        </div>
        <div>
          <p className="font-semibold text-sm text-muted-foreground">{title}</p>
          <p className="text-xs text-muted-foreground/70 mt-0.5">
            {description}
          </p>
        </div>
        <p className="text-xs text-amber-500 dark:text-amber-400 font-medium mt-auto">
          Solo Premium
        </p>
      </div>
    );
  }

  // Locked free achievement
  return (
    <div className="rounded-xl bg-white dark:bg-muted/30 border border-border p-4 flex flex-col gap-2">
      <span className="text-3xl grayscale opacity-40">{icon}</span>
      <div>
        <p className="font-semibold text-sm text-muted-foreground">{title}</p>
        <p className="text-xs text-muted-foreground/70 mt-0.5">{description}</p>
      </div>
    </div>
  );
}
