"use client"

import { useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Search } from "lucide-react"
import { CATEGORIES, CATEGORY_ICONS } from "@/lib/agents"

export function DiscoverSidebar() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentCategory = searchParams.get("category") ?? "all"

  const setCategory = useCallback(
    (id: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (id === "all") {
        params.delete("category")
      } else {
        params.set("category", id)
      }
      const qs = params.toString()
      router.push(`/discover${qs ? `?${qs}` : ""}`)
    },
    [router, searchParams],
  )

  const handleSearch = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      const form = e.currentTarget
      const input = form.elements.namedItem("q") as HTMLInputElement
      const q = input.value.trim()
      const params = new URLSearchParams(searchParams.toString())
      if (q) {
        params.set("q", q)
      } else {
        params.delete("q")
      }
      const qs = params.toString()
      router.push(`/discover${qs ? `?${qs}` : ""}`)
    },
    [router, searchParams],
  )

  return (
    <aside className="hidden md:flex w-56 shrink-0 flex-col border-r border-border/40 bg-sidebar px-4 py-6">
      {/* Search */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex h-8 items-center gap-2 rounded-lg bg-card px-2.5">
          <Search className="size-3.5 shrink-0 text-muted-foreground" />
          <input
            name="q"
            type="text"
            placeholder="Search"
            defaultValue={searchParams.get("q") ?? ""}
            className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>
      </form>

      {/* Categories heading */}
      <p className="mb-3 px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
        Categories
      </p>

      {/* Category list */}
      <nav className="flex flex-col gap-0.5">
        {CATEGORIES.map((cat) => {
          const Icon = CATEGORY_ICONS[cat.id]
          const active = currentCategory === cat.id
          return (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors duration-150 ${
                active
                  ? "bg-primary/15 text-primary"
                  : "text-sidebar-foreground hover:text-foreground hover:bg-card"
              }`}
            >
              {Icon && <Icon className="size-4 shrink-0" />}
              {cat.label}
            </button>
          )
        })}
      </nav>
    </aside>
  )
}
