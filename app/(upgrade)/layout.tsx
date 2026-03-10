import { isAuthenticated } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import type { PropsWithChildren } from "react";

export default async function UpgradeLayout({ children }: PropsWithChildren) {
  const authed = await isAuthenticated();
  if (!authed) redirect("/login");

  return (
    <div className="min-h-dvh bg-background text-foreground">{children}</div>
  );
}
