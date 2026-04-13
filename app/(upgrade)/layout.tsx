import { requireAuthWithProfile } from "@/lib/auth-server";
import type { PropsWithChildren } from "react";

export default async function UpgradeLayout({ children }: PropsWithChildren) {
  await requireAuthWithProfile();

  return (
    <div className="min-h-dvh bg-background text-foreground">{children}</div>
  );
}
