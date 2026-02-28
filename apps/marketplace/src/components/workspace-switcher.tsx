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
            <SidebarMenuButton size="lg" className="transition-colors data-[state=open]:bg-sidebar-accent">
              <div className={`flex aspect-square size-8 items-center justify-center rounded-lg text-white shadow-sm ${getProjectColor(activeIndex)}`}>
                <FolderKanban className="size-4" />
              </div>
              <div className="flex flex-1 flex-col gap-0.5 leading-none">
                <span className="font-medium truncate">{active.name}</span>
                {active.description && (
                  <span className="text-[11px] text-sidebar-foreground/40 truncate">{active.description}</span>
                )}
              </div>
              <ChevronsUpDown className="ml-auto size-4 text-sidebar-foreground/30" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="min-w-[280px] rounded-xl border-white/[0.08] bg-popover/95 p-1.5 shadow-2xl backdrop-blur-xl"
            align="start"
            sideOffset={8}
          >
            <DropdownMenuLabel className="px-2 pb-1.5 text-[11px] uppercase tracking-widest text-muted-foreground/60">
              Projects
            </DropdownMenuLabel>
            {projects.map((project, i) => (
              <DropdownMenuItem
                key={project.id}
                onClick={() => switchProject(project.id)}
                className="gap-3 rounded-lg px-2.5 py-2.5"
              >
                <div className={`flex aspect-square size-7 items-center justify-center rounded-md text-white ${getProjectColor(i)}`}>
                  <FolderKanban className="size-3.5" />
                </div>
                <div className="flex flex-1 flex-col">
                  <span className="text-sm font-medium">{project.name}</span>
                  {project.description && (
                    <span className="text-[11px] text-muted-foreground">{project.description}</span>
                  )}
                </div>
                {project.id === active.id && (
                  <Check className="ml-auto size-4 text-primary" />
                )}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator className="my-1.5 bg-white/[0.06]" />
            {creating ? (
              <div className="flex items-center gap-2 px-2.5 py-2" onClick={(e) => e.stopPropagation()}>
                <input
                  ref={inputRef}
                  autoFocus
                  placeholder="Project name..."
                  className="h-8 flex-1 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-primary/40 focus:bg-white/[0.06]"
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
                  className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground disabled:opacity-50"
                >
                  {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                </button>
              </div>
            ) : (
              <DropdownMenuItem
                className="gap-3 rounded-lg px-2.5 py-2.5 text-muted-foreground"
                onSelect={(e) => {
                  e.preventDefault()
                  setCreating(true)
                }}
              >
                <div className="flex aspect-square size-7 items-center justify-center rounded-md border border-dashed border-white/[0.12]">
                  <Plus className="size-3.5" />
                </div>
                <span className="text-sm">New project</span>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
