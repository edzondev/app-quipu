"use client";

import {
  Calendar,
  DollarSign,
  Gift,
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
import { NavItems } from "./nav-items";
import { NavUser } from "./nav-user";

// This is sample data.
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  projects: [
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
    {
      name: "Día de pago",
      url: "/payday",
      icon: Calendar,
    },
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
  ],
};

export default function AppSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>L</SidebarHeader>
      <SidebarContent>
        <NavItems items={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
