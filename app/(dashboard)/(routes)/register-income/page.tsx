import { api } from "@/convex/_generated/api";
import { preloadAuthQuery } from "@/lib/auth-server";
import RegisterIncomeView from "@/modules/payday/components/register-income/register-income-view";
import { preloadedQueryResult } from "convex/nextjs";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Registrar ingreso",
  description:
    "Registra un ingreso extraordinario y distribúyelo entre tus sobres.",
};

export default async function RegisterIncomePage() {
  const preloadedProfile = await preloadAuthQuery(api.profiles.getMyProfile);
  const profile = preloadedQueryResult(preloadedProfile);

  if (!profile || profile.workerType !== "independent") {
    redirect("/dashboard");
  }

  return <RegisterIncomeView preloadedProfile={preloadedProfile} />;
}
