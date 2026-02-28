"use client"

import { useState, useRef, useTransition } from "react"
import { useRouter } from "next/navigation"
import { ChevronsUpDown, Plus, Check, FolderKanban, Loader2 } from "lucide-react"

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
import { createProject } from "@/lib/projects/actions"

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
  const [creating, setCreating] = useState(false)
  const [pending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  function switchProject(projectId: string) {
    document.cookie = `active_project=${projectId};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`
    router.refresh()
  }

  function handleCreate() {
    const name = inputRef.current?.value.trim()
    if (!name) return

    startTransition(async () => {
      const result = await createProject(name)
      if (result.id) {
        // Switch to the new project
        document.cookie = `active_project=${result.id};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`
        setCreating(false)
        router.refresh()
      }
    })
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
        <DropdownMenu onOpenChange={(open) => { if (!open) setCreating(false) }}>
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
            {creating ? (
              <div className="flex items-center gap-2 px-2 py-1.5" onClick={(e) => e.stopPropagation()}>
                <input
                  ref={inputRef}
                  autoFocus
                  placeholder="Project name"
                  className="h-7 flex-1 rounded-md border border-input bg-transparent px-2 text-sm outline-none placeholder:text-muted-foreground focus:border-primary/50"
                  onKeyDown={(e) => {
                    e.stopPropagation()
                    if (e.key === 'Enter') handleCreate()
                    if (e.key === 'Escape') setCreating(false)
                  }}
                  disabled={pending}
                />
                <button
                  onClick={handleCreate}
                  disabled={pending}
                  className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50"
                >
                  {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                </button>
              </div>
            ) : (
              <DropdownMenuItem
                className="gap-2.5 text-muted-foreground"
                onSelect={(e) => {
                  e.preventDefault()
                  setCreating(true)
                }}
              >
                <Plus className="size-4" />
                <span>New project</span>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
