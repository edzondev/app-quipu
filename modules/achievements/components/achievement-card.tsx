import { cn } from "@/lib/utils";

type Achievement = {
  achievementId: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  unlocked: boolean;
  unlockedAt?: string;
};

type Props = {
  achievement: Achievement;
};

export default function AchievementCard({ achievement }: Props) {
  const { title, description, icon, unlocked, unlockedAt } = achievement;

  if (unlocked) {
    return (
      <div className="rounded-xl bg-envelope-savings/5 dark:bg-green-950/20 border border-envelope-savings dark:border-green-800 p-4 flex flex-col gap-2">
        <span className="text-3xl">{icon}</span>
        <div>
          <p className="font-semibold text-sm">{title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>
        {unlockedAt && (
          <p className="text-xs text-green-600 dark:text-green-400 font-medium mt-auto">
            {unlockedAt}
          </p>
        )}
      </div>
    );
  }

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
