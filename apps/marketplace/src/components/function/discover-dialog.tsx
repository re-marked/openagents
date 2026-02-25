"use client"

import * as React from "react"
import { Search, Plus } from "lucide-react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CATEGORIES, AgentInitial } from "@/lib/agents"

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
        className="!fixed !translate-x-0 !translate-y-0 !max-w-none !rounded-2xl p-0 flex flex-col gap-0 overflow-hidden !duration-0 !animate-none bg-background"
        style={{
          top: '1rem',
          left: 'calc(16rem + 1rem)',
          width: 'calc(100vw - 16rem - 2rem)',
          height: 'calc(100vh - 2rem)',
        }}
      >
        <DialogTitle className="sr-only">Discover Assistants</DialogTitle>

        {/* Header */}
        <div className="border-b border-border/50 px-8 py-6 shrink-0">
          <h1 className="text-2xl font-semibold mb-4">Discover Assistants</h1>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="What do you need help with?"
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map((cat) => (
              <Badge
                key={cat.id}
                role="button"
                onClick={() => setActiveCategory(cat.id)}
                variant={activeCategory === cat.id ? "default" : "secondary"}
                className="cursor-pointer text-sm py-1 px-3"
              >
                {cat.label}
              </Badge>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {filtered.map((agent) => (
                <Card
                  key={agent.id}
                  className="group border-0 gap-0 py-0 transition-all duration-200 hover:bg-accent cursor-pointer"
                >
                  <div className="flex items-center gap-3 p-3">
                    <AgentInitial name={agent.name} category={agent.category} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm leading-snug truncate">{agent.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{agent.tagline}</p>
                    </div>
                    <Badge className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                      <Plus className="h-3 w-3 mr-1" />
                      Add
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
