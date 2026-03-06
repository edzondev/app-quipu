import { api } from "@/convex/_generated/api";
import { preloadAuthQuery } from "@/lib/auth-server";
import Client from "@/modules/dashboard/components/client";

export default async function DashboardPage() {
  const preloaded = await preloadAuthQuery(api.payday.getDashboardData);

  return <Client preloaded={preloaded} />;
}
