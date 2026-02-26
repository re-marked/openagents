"use client"

import * as React from "react"
import { Home, Settings, Plus, BarChart3, CreditCard, Key } from "lucide-react"
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
  instanceId: string
  name: string
  slug: string
  category: string
  tagline: string
  status: string
  teamId: string | null
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  projectId?: string
  userEmail?: string
  agents?: AgentInfo[]
}

const STATUS_DOT: Record<string, string> = {
  running: "bg-green-500",
  suspended: "bg-yellow-500",
  provisioning: "bg-blue-500 animate-pulse",
  error: "bg-red-500",
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

export function AppSidebar({
  projectId,
  userEmail,
  agents = [],
  ...props
}: AppSidebarProps) {
  const pathname = usePathname()

  return (
    <Sidebar variant="inset" collapsible="icon" {...props}>
      <SidebarHeader>
        <WorkspaceSwitcher />
      </SidebarHeader>

      <SidebarContent>
        {/* General */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/workspace/home"}>
                  <Link href="/workspace/home">
                    <Home className="size-4" />
                    <span>Home</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Agents */}
        <SidebarGroup>
          <SidebarGroupLabel>Your Agents</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {agents.map((agent) => {
                const chatPath = agent.teamId && projectId
                  ? `/workspace/p/${projectId}/t/${agent.teamId}/chat`
                  : null
                const isActive = chatPath ? pathname === chatPath : false
                const bg = CATEGORY_COLOR[agent.category] ?? "bg-zinc-500"

                return (
                  <SidebarMenuItem key={agent.instanceId}>
                    <SidebarMenuButton
                      asChild={!!chatPath}
                      isActive={isActive}
                      className="gap-2.5"
                    >
                      {chatPath ? (
                        <Link href={chatPath}>
                          <span className="relative flex shrink-0">
                            <span className={`flex h-5 w-5 items-center justify-center rounded-md ${bg} text-[10px] font-bold text-white`}>
                              {agent.name[0]}
                            </span>
                            <span className={`absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-sidebar ${STATUS_DOT[agent.status] ?? "bg-zinc-400"}`} />
                          </span>
                          <span className="truncate">{agent.name}</span>
                        </Link>
                      ) : (
                        <>
                          <span className="relative flex shrink-0">
                            <span className={`flex h-5 w-5 items-center justify-center rounded-md ${bg} text-[10px] font-bold text-white`}>
                              {agent.name[0]}
                            </span>
                            <span className={`absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-sidebar ${STATUS_DOT[agent.status] ?? "bg-zinc-400"}`} />
                          </span>
                          <span className="truncate">{agent.name}</span>
                        </>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}

              {/* Hire new agent */}
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/discover" className="text-muted-foreground">
                    <Plus className="size-4" />
                    <span>Hire an Agent</span>
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
                <SidebarMenuButton asChild isActive={pathname === "/workspace/usage"}>
                  <Link href="/workspace/usage">
                    <BarChart3 className="size-4" />
                    <span>Usage</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/workspace/billing"}>
                  <Link href="/workspace/billing">
                    <CreditCard className="size-4" />
                    <span>Billing</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/workspace/settings"}>
                  <Link href="/workspace/settings">
                    <Key className="size-4" />
                    <span>API Keys</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/workspace/settings/general"}>
                  <Link href="/workspace/settings/general">
                    <Settings className="size-4" />
                    <span>Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {userEmail && (
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
      )}

      <SidebarRail />
    </Sidebar>
  )
}
