import { api } from "@/convex/_generated/api";
import { preloadAuthQuery } from "@/lib/auth-server";
import { getServerCalendarStrings } from "@/lib/server-calendar";
import PaydayView from "@/modules/payday/components/payday-view";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Día de pago",
  description:
    "Registra tu ingreso mensual y distribuye el presupuesto entre tus sobres.",
};

export default async function PaydayPage() {
  const { month, today } = await getServerCalendarStrings();
  const preloadedPaydayStatus = await preloadAuthQuery(
    api.payday.getPaydayStatus,
    { month, today },
  );

  return (
    <>
      <PaydayView preloadedPaydayStatus={preloadedPaydayStatus} />
    </>
  );
}
