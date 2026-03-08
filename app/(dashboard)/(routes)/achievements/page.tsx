import { api } from "@/convex/_generated/api";
import { preloadAuthQuery } from "@/lib/auth-server";
import AchievementsClient from "@/modules/achievements/components/achievements-client";

export default async function AchievementsPage() {
  const preloaded = await preloadAuthQuery(api.streaks.getAchievementsData);

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Logros y Rachas</h1>
        <p className="text-muted-foreground mt-1">
          Tu progreso hacia la disciplina financiera
        </p>
      </div>
      <AchievementsClient preloaded={preloaded} />
    </>
  );
}
