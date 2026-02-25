"use client"

import * as React from "react"
import { Search, Plus } from "lucide-react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { CATEGORIES, CATEGORY_COLORS, AgentInitial } from "@/lib/agents"

interface Agent {
  id: string
  slug: string
  name: string
  tagline: string
  category: string
}

interface DiscoverDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  agents: Agent[]
}

export function DiscoverDialog({ open, onOpenChange, agents }: DiscoverDialogProps) {
  const [search, setSearch] = React.useState("")
  const [activeCategory, setActiveCategory] = React.useState("all")

  const filtered = agents.filter((a) => {
    const matchesCategory = activeCategory === "all" || a.category === activeCategory
    const matchesSearch =
      !search ||
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.tagline.toLowerCase().includes(search.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="!fixed !translate-x-0 !translate-y-0 !max-w-none !rounded-2xl border p-0 flex flex-col gap-0 overflow-hidden !duration-0 !animate-none"
        style={{
          top: '1rem',
          left: 'calc(16rem + 1rem)',
          width: 'calc(100vw - 16rem - 2rem)',
          height: 'calc(100vh - 2rem)',
        }}
      >
        <DialogTitle className="sr-only">Discover Assistants</DialogTitle>

        {/* Header */}
        <div className="border-b px-8 py-6 shrink-0">
          <h1 className="text-2xl font-semibold mb-4">Discover Assistants</h1>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="What do you need help with?"
              className="pl-9 h-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                  activeCategory === cat.id
                    ? "bg-foreground text-background"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
              <p className="text-sm">No assistants found. Try a different search.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map((agent) => (
                <div
                  key={agent.id}
                  className="group relative flex flex-col gap-3 rounded-xl border bg-card p-4 hover:border-foreground/20 hover:shadow-sm transition-all cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <AgentInitial name={agent.name} category={agent.category} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm leading-snug">{agent.name}</p>
                      <Badge
                        variant="secondary"
                        className={`mt-1 text-[10px] px-1.5 py-0 ${CATEGORY_COLORS[agent.category] ?? ""}`}
                      >
                        {agent.category}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{agent.tagline}</p>
                  <button className="mt-auto flex items-center justify-center gap-1.5 rounded-lg bg-foreground text-background text-xs font-medium py-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Plus className="h-3 w-3" />
                    Add to team
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
