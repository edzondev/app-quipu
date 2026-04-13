import { api } from "@/convex/_generated/api";
import { preloadAuthQuery } from "@/lib/auth-server";
import { SavingsClient } from "@/modules/savings/components/savings-client";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Ahorros",
  description:
    "Gestiona tus sub-sobres de ahorro, objetivos y fondo de emergencia.",
};

async function SavingsContent() {
  const [preloadedSubs, preloadedGoals, preloadedProfile] = await Promise.all([
    preloadAuthQuery(api.savings.getSavingsSubEnvelopes),
    preloadAuthQuery(api.savings.getSavingsGoals),
    preloadAuthQuery(api.profiles.getMyProfile),
  ]);

  return (
    <SavingsClient
      preloadedSubs={preloadedSubs}
      preloadedGoals={preloadedGoals}
      preloadedProfile={preloadedProfile}
    />
  );
}

export default function SavingsPage() {
  return (
    <Suspense fallback={null}>
      <SavingsContent />
    </Suspense>
  );
}
