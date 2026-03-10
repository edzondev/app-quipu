import { type LucideIcon } from "lucide-react";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/core/components/ui/sidebar";
import { PremiumBadge } from "@/core/components/shared/premium-badge";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function NavItems({
  items,
}: {
  items: {
    name: string;
    url: string;
    icon: LucideIcon;
    premium?: boolean;
  }[];
}) {
  const pathname = usePathname();
  return (
    <SidebarGroup className="group-data-[collapsible=icon]:block">
      <SidebarGroupLabel>MENU</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem
            key={item.name}
            className={cn("group/menu-item relative", {
              "bg-primary rounded-md text-white": pathname === item.url,
            })}
          >
            <SidebarMenuButton tooltip={item.name} asChild>
              <Link href={item.url} aria-label={item.name} prefetch>
                <item.icon />
                <span className="flex items-center gap-1.5">
                  {item.name}
                  {item.premium ? <PremiumBadge /> : null}
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
