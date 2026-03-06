import { api } from "@/convex/_generated/api";
import { preloadAuthQuery } from "@/lib/auth-server";
import PaydayView from "@/modules/payday/components/PaydayView";

export default async function PaydayPage() {
  const preloadedPaydayStatus = await preloadAuthQuery(
    api.payday.getPaydayStatus,
  );

  return (
    <>
      <PaydayView preloadedPaydayStatus={preloadedPaydayStatus} />
    </>
  );
}
