import { api } from "@/convex/_generated/api";
import { preloadAuthQuery } from "@/lib/auth-server";
import { getServerCalendarStrings } from "@/lib/server-calendar";
import RescueView from "@/modules/rescue/components/rescue-view";
import { preloadedQueryResult } from "convex/nextjs";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Modo Rescate",
  description:
    "Equilibra tus sobres negativos usando el saldo disponible de otros sobres.",
};

export default async function RescuePage() {
  const { month } = await getServerCalendarStrings();
  const preloaded = await preloadAuthQuery(api.rescue.getRescueStatus, {
    month,
  });
  const status = preloadedQueryResult(preloaded);

  if (!status || !status.isInRescue) redirect("/");

  return <RescueView preloaded={preloaded} />;
}
