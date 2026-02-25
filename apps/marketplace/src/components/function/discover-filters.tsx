"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Search } from "lucide-react"
import { CATEGORIES } from "@/lib/agents"

const SORT_OPTIONS = [
  { id: "trending", label: "Trending" },
  { id: "newest", label: "Newest" },
  { id: "highest_rated", label: "Highest Rated" },
  { id: "most_hired", label: "Most Hired" },
] as const

export function DiscoverFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const currentQuery = searchParams.get("q") ?? ""
  const currentCategory = searchParams.get("category") ?? "all"
  const currentSort = searchParams.get("sort") ?? "trending"

  const [search, setSearch] = useState(currentQuery)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString())
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "" || (key === "category" && value === "all") || (key === "sort" && value === "trending")) {
          params.delete(key)
        } else {
          params.set(key, value)
        }
      }
      const qs = params.toString()
      router.push(`/discover${qs ? `?${qs}` : ""}`)
    },
    [router, searchParams],
  )

  // Sync search input if URL changes externally (e.g. header search)
  useEffect(() => {
    setSearch(searchParams.get("q") ?? "")
  }, [searchParams])

  function handleSearchChange(value: string) {
    setSearch(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      updateParams({ q: value || null })
    }, 300)
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="What do you need help with?"
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full rounded-lg border bg-muted/50 py-2.5 pl-9 pr-4 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-ring focus:bg-background transition-colors"
        />
      </div>

      {/* Categories + Sort */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => updateParams({ category: cat.id })}
              className={`shrink-0 rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                currentCategory === cat.id
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <select
          value={currentSort}
          onChange={(e) => updateParams({ sort: e.target.value })}
          className="shrink-0 rounded-lg border bg-muted/50 px-3 py-1.5 text-sm text-foreground outline-none cursor-pointer"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
