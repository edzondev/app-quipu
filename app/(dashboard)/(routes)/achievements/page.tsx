import { api } from "@/convex/_generated/api";
import { preloadAuthQuery } from "@/lib/auth-server";
import AchievementsClient from "@/modules/achievements/components/achievements-client";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Logros y Rachas",
  description:
    "Tu progreso hacia la disciplina financiera: rachas activas y logros desbloqueados.",
};

async function AchievementsContent() {
  const preloaded = await preloadAuthQuery(api.streaks.getAchievementsData);
  return <AchievementsClient preloaded={preloaded} />;
}

export default function AchievementsPage() {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Logros y Rachas</h1>
        <p className="text-muted-foreground mt-1">
          Tu progreso hacia la disciplina financiera
        </p>
      </div>
      <Suspense fallback={null}>
        <AchievementsContent />
      </Suspense>
    </>
  );
}
