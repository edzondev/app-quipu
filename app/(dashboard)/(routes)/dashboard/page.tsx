import { api } from "@/convex/_generated/api";
import { preloadAuthQuery } from "@/lib/auth-server";
import { getServerCalendarStrings } from "@/lib/server-calendar";
import Client from "@/modules/dashboard/components/client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  description:
    "Resumen de tus sobres de presupuesto, gastos recientes y estado financiero del mes.",
};

export default async function DashboardPage() {
  const { month, today } = await getServerCalendarStrings();
  const preloaded = await preloadAuthQuery(api.payday.getDashboardData, {
    month,
    today,
  });
  return <Client preloaded={preloaded} />;
}
