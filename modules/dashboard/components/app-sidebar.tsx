"use client";

import { api } from "@/convex/_generated/api";
import { usePlan } from "@/hooks/use-plan";
import { useQuery } from "convex/react";
import {
  BadgeDollarSign,
  Calendar,
  Crown,
  LayoutDashboard,
  PiggyBank,
  PlusCircle,
  Trophy,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/core/components/ui/sidebar";
import { NavHeader } from "./nav-header";
import { NavItems } from "./nav-items";
import { NavUser } from "./nav-user";
import { UpgradeBanner } from "./upgrade-banner";

export default function AppSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const profile = useQuery(api.profiles.getMyProfile);
  const email = useQuery(api.profiles.getMyUserEmail);
  const { isPremium } = usePlan();

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
    {
      name: "Registrar gasto",
      url: "/add-expense",
      icon: PlusCircle,
    },
    ...(!isPremium
      ? [
          {
            name: "Ver planes",
            url: "/upgrade",
            icon: Crown,
          },
        ]
      : []),
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
        <NavUser
          user={{
            name: profile?.name,
            email: email ?? undefined,
            avatar: profile?.name,
          }}
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
