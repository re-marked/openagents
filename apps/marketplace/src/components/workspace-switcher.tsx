"use client"

import { useRouter } from "next/navigation"
import { ChevronsUpDown, Plus, Check, FolderKanban } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export interface ProjectInfo {
  id: string
  name: string
  description: string | null
}

interface WorkspaceSwitcherProps {
  projects: ProjectInfo[]
  activeProjectId: string | null
}

const PROJECT_COLORS = [
  "bg-indigo-600",
  "bg-emerald-600",
  "bg-amber-600",
  "bg-cyan-600",
  "bg-purple-600",
  "bg-rose-600",
]

function getProjectColor(index: number) {
  return PROJECT_COLORS[index % PROJECT_COLORS.length]
}

export function WorkspaceSwitcher({ projects, activeProjectId }: WorkspaceSwitcherProps) {
  const router = useRouter()
  const active = projects.find((p) => p.id === activeProjectId) ?? projects[0]

  function switchProject(projectId: string) {
    document.cookie = `active_project=${projectId};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`
    router.refresh()
  }

  if (!active) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" className="text-muted-foreground">
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-zinc-700">
              <FolderKanban className="size-4" />
            </div>
            <span className="text-sm">No projects yet</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  const activeIndex = projects.findIndex((p) => p.id === active.id)

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent">
              <div className={`flex aspect-square size-8 items-center justify-center rounded-lg text-white ${getProjectColor(activeIndex)}`}>
                <FolderKanban className="size-4" />
              </div>
              <div className="flex flex-1 flex-col gap-0.5 leading-none">
                <span className="font-medium truncate">{active.name}</span>
                {active.description && (
                  <span className="text-xs text-sidebar-foreground/50 truncate">{active.description}</span>
                )}
              </div>
              <ChevronsUpDown className="ml-auto size-4 text-sidebar-foreground/50" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]" align="start">
            <DropdownMenuLabel>Projects</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {projects.map((project, i) => (
              <DropdownMenuItem
                key={project.id}
                onClick={() => switchProject(project.id)}
                className="gap-2.5"
              >
                <div className={`flex aspect-square size-6 items-center justify-center rounded text-white text-xs ${getProjectColor(i)}`}>
                  <FolderKanban className="size-3" />
                </div>
                <span className="truncate">{project.name}</span>
                {project.id === active.id && (
                  <Check className="ml-auto size-4 text-primary" />
                )}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2.5 text-muted-foreground" disabled>
              <Plus className="size-4" />
              <span>New project</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
