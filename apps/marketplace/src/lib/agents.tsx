export const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "productivity", label: "Productivity" },
  { id: "research", label: "Research" },
  { id: "writing", label: "Writing" },
  { id: "coding", label: "Coding" },
  { id: "business", label: "Business" },
  { id: "creative", label: "Creative" },
  { id: "personal", label: "Personal" },
] as const

export const CATEGORY_COLORS: Record<string, string> = {
  productivity: "bg-blue-500/10 text-blue-400",
  research: "bg-emerald-500/10 text-emerald-400",
  writing: "bg-purple-500/10 text-purple-400",
  coding: "bg-amber-500/10 text-amber-400",
  business: "bg-rose-500/10 text-rose-400",
  creative: "bg-pink-500/10 text-pink-400",
  personal: "bg-cyan-500/10 text-cyan-400",
  general: "bg-zinc-500/10 text-zinc-400",
}

const CATEGORY_BG_COLORS: Record<string, string> = {
  productivity: "bg-blue-500",
  research: "bg-emerald-500",
  writing: "bg-purple-500",
  coding: "bg-amber-500",
  business: "bg-rose-500",
  creative: "bg-pink-500",
  personal: "bg-cyan-500",
  general: "bg-indigo-500",
}

export function AgentInitial({ name, category }: { name: string; category: string }) {
  const bg = CATEGORY_BG_COLORS[category] ?? "bg-zinc-500"
  return (
    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${bg} text-white text-lg font-semibold shrink-0`}>
      {name[0]}
    </div>
  )
}

export type AgentCategory = (typeof CATEGORIES)[number]["id"]

export interface AgentListItem {
  id: string
  slug: string
  name: string
  tagline: string
  category: string
  avg_rating: number | null
  total_hires: number
  total_reviews: number
  pricing_model: string
  credits_per_session: number | null
  icon_url: string | null
  creator_name: string | null
}
