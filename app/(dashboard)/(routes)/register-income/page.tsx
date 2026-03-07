import { redirect } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { fetchAuthQuery, preloadAuthQuery } from "@/lib/auth-server";
import RegisterIncomeView from "@/modules/payday/components/register-income/register-income-view";

export default async function RegisterIncomePage() {
  const profile = await fetchAuthQuery(api.profiles.getMyProfile);

  if (!profile || profile.workerType !== "independent") {
    redirect("/dashboard");
  }

  const preloadedProfile = await preloadAuthQuery(api.profiles.getMyProfile);

  return <RegisterIncomeView preloadedProfile={preloadedProfile} />;
}
