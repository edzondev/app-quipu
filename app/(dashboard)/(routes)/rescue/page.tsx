import { api } from "@/convex/_generated/api";
import { fetchAuthQuery, preloadAuthQuery } from "@/lib/auth-server";
import RescueView from "@/modules/rescue/components/rescue-view";
import { redirect } from "next/navigation";

export default async function RescuePage() {
  const status = await fetchAuthQuery(api.rescue.getRescueStatus);
  if (!status || !status.isInRescue) redirect("/");

  const preloaded = await preloadAuthQuery(api.rescue.getRescueStatus);
  return <RescueView preloaded={preloaded} />;
}
