import { createServiceClient } from '@openagents/db/server'

const DEMO_AGENTS = [
  {
    name: "Nova",
    slug: "nova-research",
    tagline: "Deep-dive researcher that synthesizes sources into clear summaries",
    description: "Nova reads papers, articles, and documentation to give you thorough, well-cited answers. Perfect for literature reviews, competitive analysis, and fact-checking.",
    category: "research",
    pricing_model: "free",
    tags: ["research", "summarization", "citations"],
  },
  {
    name: "Scribe",
    slug: "scribe-writer",
    tagline: "Versatile writing assistant for blogs, emails, and long-form content",
    description: "Scribe adapts to your voice and tone. From punchy social posts to detailed whitepapers, it writes drafts you actually want to use.",
    category: "writing",
    pricing_model: "free",
    tags: ["writing", "copywriting", "editing"],
  },
  {
    name: "Archie",
    slug: "archie-coder",
    tagline: "Full-stack coding partner that writes, reviews, and debugs code",
    description: "Archie understands your codebase context and writes production-ready code. Supports TypeScript, Python, Rust, Go, and more.",
    category: "coding",
    pricing_model: "credits",
    credits_per_session: 5,
    tags: ["coding", "debugging", "code-review"],
  },
  {
    name: "Planner",
    slug: "planner-productivity",
    tagline: "Turns vague goals into actionable plans with deadlines and milestones",
    description: "Tell Planner what you want to achieve and it breaks it down into concrete steps. Integrates with your calendar and task manager.",
    category: "productivity",
    pricing_model: "free",
    tags: ["planning", "project-management", "goals"],
  },
  {
    name: "Ledger",
    slug: "ledger-business",
    tagline: "Financial analyst that reads spreadsheets and generates reports",
    description: "Upload your financials and Ledger will find trends, flag anomalies, and create executive-ready reports with charts.",
    category: "business",
    pricing_model: "credits",
    credits_per_session: 10,
    tags: ["finance", "analytics", "reporting"],
  },
  {
    name: "Muse",
    slug: "muse-creative",
    tagline: "Creative brainstorming partner for ideas, stories, and concepts",
    description: "Muse helps you break through creative blocks. Whether you're designing a brand, writing fiction, or brainstorming product ideas, Muse keeps the ideas flowing.",
    category: "creative",
    pricing_model: "free",
    tags: ["brainstorming", "ideation", "storytelling"],
  },
  {
    name: "Coach",
    slug: "coach-personal",
    tagline: "Personal growth coach that helps you build better habits",
    description: "Coach provides accountability, tracks your progress, and offers evidence-based advice for health, productivity, and mindset.",
    category: "personal",
    pricing_model: "free",
    tags: ["coaching", "habits", "self-improvement"],
  },
  {
    name: "Catalyst",
    slug: "catalyst-productivity",
    tagline: "Automates repetitive workflows so you can focus on what matters",
    description: "Catalyst connects to your tools and automates the boring stuff — email triage, data entry, report generation, and more.",
    category: "productivity",
    pricing_model: "credits",
    credits_per_session: 3,
    tags: ["automation", "workflows", "integration"],
  },
]

/**
 * Seeds demo agents if the agents table is empty.
 * Uses service client to bypass RLS. Safe to call on every page load —
 * only inserts when count is 0.
 */
export async function seedDemoAgentsIfEmpty() {
  const service = createServiceClient()

  const { count } = await service
    .from("agents")
    .select("*", { count: "exact", head: true })
    .eq("status", "published")

  if (count && count > 0) return

  // We need a creator_id — use a placeholder or the first user
  const { data: firstUser } = await service
    .from("users")
    .select("id")
    .limit(1)
    .single()

  if (!firstUser) return // no users yet, can't seed

  const now = new Date().toISOString()
  const agents = DEMO_AGENTS.map((a) => ({
    ...a,
    creator_id: firstUser.id,
    github_repo_url: `https://github.com/openagents/${a.slug}`,
    status: "published" as const,
    published_at: now,
    total_hires: Math.floor(Math.random() * 500) + 10,
    total_reviews: Math.floor(Math.random() * 100) + 5,
    avg_rating: Math.round((3.5 + Math.random() * 1.5) * 10) / 10,
  }))

  await service.from("agents").upsert(agents, { onConflict: "slug" })
}
