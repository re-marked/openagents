"use client"

import * as React from "react"
import { Hash, Home, Settings, Users } from "lucide-react"
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

interface TeamMemberInfo {
  name: string
  status: string
  color: string
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  projectId?: string
  teamId?: string
  teamName?: string
  userEmail?: string
  teamMembers?: TeamMemberInfo[]
}

const STATUS_DOT_COLORS: Record<string, string> = {
  running: "bg-green-500",
  suspended: "bg-yellow-500",
  provisioning: "bg-blue-500 animate-pulse",
  error: "bg-red-500",
}

export function AppSidebar({
  projectId,
  teamId,
  teamName = "team-chat",
  userEmail,
  teamMembers = [],
  ...props
}: AppSidebarProps) {
  const pathname = usePathname()
  const chatPath =
    projectId && teamId
      ? `/workspace/p/${projectId}/t/${teamId}/chat`
      : null

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <WorkspaceSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>General</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/workspace/home"}>
                  <Link href="/workspace/home">
                    <Home />
                    <span>Home</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {chatPath && (
          <SidebarGroup>
            <SidebarGroupLabel>Channels</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname === chatPath}>
                    <Link href={chatPath}>
                      <Hash />
                      <span>{teamName}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {teamMembers.length > 0 && projectId && teamId && (
          <SidebarGroup>
            <SidebarGroupLabel>Team</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {teamMembers.map((member) => (
                  <SidebarMenuItem key={member.name}>
                    <SidebarMenuButton asChild={false} className="cursor-default">
                      <span className={`inline-block h-2 w-2 rounded-full ${STATUS_DOT_COLORS[member.status] ?? "bg-zinc-400"}`} />
                      <span>{member.name}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === `/workspace/p/${projectId}/t/${teamId}/settings`}
                  >
                    <Link href={`/workspace/p/${projectId}/t/${teamId}/settings`}>
                      <Users className="h-4 w-4" />
                      <span>Manage team</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarGroup>
          <SidebarGroupLabel>Account</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/workspace/settings"}>
                  <Link href="/workspace/settings">
                    <Settings />
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
