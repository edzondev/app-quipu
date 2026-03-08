type Props = {
  currentStreak: number;
  longestStreak: number;
};

export default function StreakBanner({ currentStreak, longestStreak }: Props) {
  return (
    <div className="rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-5 flex items-center gap-4 mb-8">
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/40 shrink-0">
        <span className="text-2xl">🔥</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-2xl font-bold text-amber-900 dark:text-amber-100">
          {currentStreak} {currentStreak === 1 ? "mes" : "meses"}
        </p>
        <p className="text-sm text-amber-700 dark:text-amber-400">
          Racha actual · Mejor racha: {longestStreak}{" "}
          {longestStreak === 1 ? "mes" : "meses"}
        </p>
      </div>
    </div>
  );
}
