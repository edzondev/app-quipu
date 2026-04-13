"use client";

import { useQuery } from "convex/react";
import {
  BadgeDollarSign,
  Calendar,
  LayoutDashboard,
  PiggyBank,
  PlusCircle,
  Trophy,
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarRail,
} from "@/core/components/ui/sidebar";
import { Skeleton } from "@/core/components/ui/skeleton";
import { usePlan } from "@/hooks/use-plan";
import { NavHeader } from "./nav-header";
import { NavItems } from "./nav-items";
import { NavUser } from "./nav-user";
import { UpgradeBanner } from "./upgrade-banner";

export default function AppSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const profile = useQuery(api.profiles.getMyProfile);
  const email = useQuery(api.profiles.getMyUserEmail);
  const { isPremium, isLoading } = usePlan();

  const paydayOrIncomeItem =
    profile?.workerType === "independent"
      ? {
          name: "Registrar Ingreso",
          url: "/register-income",
          icon: PlusCircle,
        }
      : {
          name: "Día de pago",
          url: "/payday",
          icon: Calendar,
        };

  const navItems = [
    {
      name: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Gastos",
      url: "/expenses",
      icon: BadgeDollarSign,
    },
    {
      name: "Ahorro",
      url: "/savings",
      icon: PiggyBank,
    },
    {
      name: "Logros",
      url: "/achievements",
      icon: Trophy,
      premium: !isPremium,
    },
    paydayOrIncomeItem,
  ];

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <NavHeader />
      </SidebarHeader>
      <SidebarContent>
        <NavItems items={navItems} />
      </SidebarContent>
      <SidebarFooter>
        <UpgradeBanner />
        {profile === undefined ? (
          <SidebarMenu>
            <SidebarMenuItem>
              <output
                className="flex h-12 w-full items-center gap-2 rounded-md px-2 py-1.5"
                aria-live="polite"
                aria-busy="true"
              >
                <span className="sr-only">Cargando usuario</span>
                <Skeleton className="size-8 shrink-0 rounded-lg" />
                <div className="grid min-w-0 flex-1 gap-1.5 text-left">
                  <Skeleton className="h-4 w-[7.5rem] rounded-md" />
                  <Skeleton className="h-3 w-16 rounded-md" />
                </div>
                <Skeleton className="ml-auto size-4 shrink-0 rounded-sm opacity-60" />
              </output>
            </SidebarMenuItem>
          </SidebarMenu>
        ) : (
          <NavUser
            user={{
              name: profile?.name,
              email: email ?? undefined,
              avatar: profile?.name,
            }}
            isLoading={isLoading}
            isPremium={isPremium}
          />
        )}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
