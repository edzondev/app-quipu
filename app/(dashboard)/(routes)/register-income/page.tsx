import { api } from "@/convex/_generated/api";
import { preloadAuthQuery } from "@/lib/auth-server";
import RegisterIncomeView from "@/modules/payday/components/register-income/register-income-view";
import { preloadedQueryResult } from "convex/nextjs";
import { redirect } from "next/navigation";

export default async function RegisterIncomePage() {
  const preloadedProfile = await preloadAuthQuery(api.profiles.getMyProfile);
  const profile = preloadedQueryResult(preloadedProfile);

  if (!profile || profile.workerType !== "independent") {
    redirect("/dashboard");
  }

  return <RegisterIncomeView preloadedProfile={preloadedProfile} />;
}
