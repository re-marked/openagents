"use client"

import * as React from "react"
import { LayoutDashboard, Bot, DollarSign, Settings, Plus } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { WorkspaceSwitcher } from "@/components/workspace-switcher"
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
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface AgentInfo {
  id: string
  slug: string
  name: string
  category: string
  status: string
}

const CATEGORY_COLOR: Record<string, string> = {
  productivity: "bg-blue-500",
  research: "bg-emerald-500",
  writing: "bg-purple-500",
  coding: "bg-amber-500",
  business: "bg-rose-500",
  creative: "bg-pink-500",
  personal: "bg-cyan-500",
}

interface PlatformSidebarProps extends React.ComponentProps<typeof Sidebar> {
  userEmail: string
  agents?: AgentInfo[]
}

export function PlatformSidebar({
  userEmail,
  agents = [],
  ...props
}: PlatformSidebarProps) {
  const pathname = usePathname()

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <WorkspaceSwitcher />
      </SidebarHeader>

      <SidebarContent>
        {/* Your Agents */}
        <SidebarGroup>
          <SidebarGroupLabel>Your Agents</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {agents.map((agent) => {
                const bg = CATEGORY_COLOR[agent.category] ?? "bg-zinc-500"
                const href = `/agents/${agent.slug}`
                const isActive = pathname === href || pathname.startsWith(href + '/')

                return (
                  <SidebarMenuItem key={agent.id}>
                    <SidebarMenuButton asChild isActive={isActive} className="gap-2.5">
                      <Link href={href}>
                        <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md ${bg} text-[10px] font-bold text-white`}>
                          {agent.name[0]}
                        </span>
                        <span className="truncate">{agent.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}

              {/* Publish new agent */}
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/agents/new" className="text-muted-foreground">
                    <Plus className="size-4" />
                    <span>Publish Agent</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Account */}
        <SidebarGroup>
          <SidebarGroupLabel>Account</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/dashboard"}>
                  <Link href="/dashboard">
                    <LayoutDashboard className="size-4" />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/agents"}>
                  <Link href="/agents">
                    <Bot className="size-4" />
                    <span>All Agents</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/earnings"}>
                  <Link href="/earnings">
                    <DollarSign className="size-4" />
                    <span>Earnings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/settings"}>
                  <Link href="/settings">
                    <Settings className="size-4" />
                    <span>Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="flex items-center gap-2 px-2 py-1.5">
          <Avatar size="sm">
            <AvatarFallback className="bg-zinc-600 text-white text-xs">
              {userEmail[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="text-sidebar-foreground/70 truncate text-xs">
            {userEmail}
          </span>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
