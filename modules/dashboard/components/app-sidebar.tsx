"use client";

import { api } from "@/convex/_generated/api";
import {
  Calendar,
  DollarSign,
  Gift,
  LayoutDashboard,
  PiggyBank,
  PlusCircle,
  Trophy,
} from "lucide-react";
import { useQuery } from "convex/react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/core/components/ui/sidebar";
import { NavItems } from "./nav-items";
import { NavUser } from "./nav-user";
import { NavHeader } from "./nav-header";

export default function AppSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const profile = useQuery(api.profiles.getMyProfile);
  const email = useQuery(api.profiles.getMyUserEmail);
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
      icon: DollarSign,
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
    },
    paydayOrIncomeItem,
    {
      name: "Ingreso extra",
      url: "/extra-income",
      icon: Gift,
    },
    {
      name: "Registrar gasto",
      url: "/add-expense",
      icon: PlusCircle,
    },
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
