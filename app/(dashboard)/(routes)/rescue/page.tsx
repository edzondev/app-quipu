import { api } from "@/convex/_generated/api";
import { preloadAuthQuery } from "@/lib/auth-server";
import RescueView from "@/modules/rescue/components/rescue-view";
import { preloadedQueryResult } from "convex/nextjs";
import { redirect } from "next/navigation";

export default async function RescuePage() {
  const preloaded = await preloadAuthQuery(api.rescue.getRescueStatus);
  const status = preloadedQueryResult(preloaded);

  if (!status || !status.isInRescue) redirect("/");

  return <RescueView preloaded={preloaded} />;
}
