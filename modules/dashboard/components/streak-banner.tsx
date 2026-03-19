import { ChevronRight, Trophy } from "lucide-react";
import Link from "next/link";

type Props = {
  currentStreak: number;
  lastAchievement: { icon: string; title: string } | null | undefined;
};

export default function StreakBanner({
  currentStreak,
  lastAchievement,
}: Props) {
  return (
    <Link href="/achievements" prefetch={false}>
      <div
        className="animate-in fade-in slide-in-from-bottom-2 duration-300 fill-mode-both rounded-xl bg-amber-50 dark:bg-amber-950/20 p-5 flex items-center gap-3 mb-6 hover:bg-amber-100 dark:hover:bg-amber-950"
        style={{ animationDelay: "400ms" }}
      >
        <span className="text-xl shrink-0">🔥</span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">
            Racha: {currentStreak} meses consecutivos
          </p>
          <p className="text-xs text-muted-foreground">
            {lastAchievement
              ? `Último logro: ${lastAchievement.icon} ${lastAchievement.title}`
              : "Completa tu primer mes para desbloquear logros"}
          </p>
        </div>
        <div className="flex items-center gap-0.5 text-muted-foreground shrink-0">
          <Trophy className="w-4 h-4" />
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>
    </Link>
  );
}
