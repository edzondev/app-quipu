import { fetchAuthQuery, isAuthenticated } from "@/lib/auth-server";
import { api } from "@/convex/_generated/api";
import { redirect } from "next/navigation";
import type { PropsWithChildren } from "react";

export default async function UpgradeLayout({ children }: PropsWithChildren) {
  const authed = await isAuthenticated();
  if (!authed) redirect("/login");

  const profile = await fetchAuthQuery(api.profiles.getMyProfile, {});
  if (!profile || !profile.onboardingComplete) redirect("/onboarding");

  return (
    <div className="min-h-dvh bg-background text-foreground">{children}</div>
  );
}
