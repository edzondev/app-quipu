import { api } from "@/convex/_generated/api";
import QuickExpenseFAB from "@/core/components/shared/quick-expense-fab";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/core/components/ui/sidebar";
import { fetchAuthQuery, isAuthenticated } from "@/lib/auth-server";
import AppSidebar from "@/modules/dashboard/components/app-sidebar";
import { redirect } from "next/navigation";
import type { PropsWithChildren } from "react";

type Props = PropsWithChildren<{}>;

export default async function DashboardLayout({ children }: Props) {
  // 1. Sin sesión → login
  const authed = await isAuthenticated();
  if (!authed) redirect("/login");

  // 2. Con sesión pero sin onboarding completo → onboarding
  const profile = await fetchAuthQuery(api.profiles.getMyProfile, {});
  if (!profile || !profile.onboardingComplete) redirect("/onboarding");

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center px-4">
            <SidebarTrigger />
          </div>
        </header>
        <main className="flex-1 overflow-auto mb-12 md:pb-0">
          <section className="container w-full md:max-w-4xl lg:max-w-7xl mx-auto px-4 pt-2 pb-6 md:px-6 h-full">
            {children}
          </section>
          <QuickExpenseFAB />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
