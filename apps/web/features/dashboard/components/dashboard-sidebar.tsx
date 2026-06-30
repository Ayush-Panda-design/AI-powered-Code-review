"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { AutoHideScroll } from "@/components/ui/auto-hide-scroll";
import { dashboardRoutes, helpRoute } from "@/features/dashboard/lib/routes";
import { WorkspaceSwitcher } from "@/features/dashboard/components/workspace-switcher";

type DashboardSidebarProps = {
  workspaces: { id: string; name: string }[];
  activeWorkspaceId: string;
};

export function DashboardSidebar({
  workspaces,
  activeWorkspaceId,
}: DashboardSidebarProps) {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={<Link href="/" />}
              className="data-[active=true]:bg-transparent"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Sparkles className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">ShipFlow AI</span>
                <span className="truncate text-xs text-muted-foreground">
                  Idea to production
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="overflow-hidden p-0">
        <AutoHideScroll className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-2">
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {dashboardRoutes.map((route) => {
                  const isActive =
                    route.href === "/dashboard"
                      ? pathname === "/dashboard"
                      : pathname === route.href ||
                        pathname.startsWith(`${route.href}/`);

                  return (
                    <SidebarMenuItem key={route.title}>
                      <SidebarMenuButton
                        isActive={isActive}
                        tooltip={route.title}
                        render={<Link href={route.href} />}
                      >
                        <route.icon />
                        <span>{route.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel>Help</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={
                      pathname === helpRoute.href ||
                      pathname.startsWith(`${helpRoute.href}/`)
                    }
                    tooltip={helpRoute.title}
                    render={<Link href={helpRoute.href} />}
                    className="bg-primary/5 font-medium text-primary hover:bg-primary/10 hover:text-primary data-[active=true]:bg-primary/10 data-[active=true]:text-primary"
                  >
                    <helpRoute.icon />
                    <span>{helpRoute.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </AutoHideScroll>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2">
        <WorkspaceSwitcher
          workspaces={workspaces}
          activeWorkspaceId={activeWorkspaceId}
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
