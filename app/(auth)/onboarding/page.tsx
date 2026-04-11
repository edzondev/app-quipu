import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { fetchAuthQuery, isAuthenticated } from "@/lib/auth-server";
import { OnboardingForm } from "@/modules/auth/components/onboarding-form";

export const metadata: Metadata = {
  title: "Configura tu cuenta",
  robots: { index: false, follow: false },
};

export default async function OnboardingPage() {
  const authed = await isAuthenticated();
  if (!authed) redirect("/login");

  const profile = await fetchAuthQuery(api.profiles.getMyProfile, {});
  if (profile?.onboardingComplete) redirect("/dashboard");

  return <OnboardingForm />;
}
