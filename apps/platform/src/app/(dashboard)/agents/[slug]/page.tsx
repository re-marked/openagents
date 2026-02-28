'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ExternalLink, Save } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { updateAgent, unpublishAgent, republishAgent } from '@/lib/publish/actions'

const CATEGORIES = [
  'productivity',
  'research',
  'writing',
  'coding',
  'business',
  'creative',
  'personal',
] as const

interface AgentDetailProps {
  params: Promise<{ slug: string }>
}

interface Agent {
  id: string
  slug: string
  name: string
  tagline: string
  description: string
  category: string
  status: string
  icon_url: string | null
  tags: string[]
  pricing_model: string
  credits_per_session: number
  github_repo_url: string | null
  total_hires: number | null
  avg_rating: number | null
  published_at: string | null
  created_at: string
}

export default function AgentDetailPage({ params }: AgentDetailProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [agent, setAgent] = useState<Agent | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Form state
  const [tagline, setTagline] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [tags, setTags] = useState('')
  const [icon, setIcon] = useState('')

  useEffect(() => {
    params.then(({ slug }) => {
      fetch(`/api/agents/${slug}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.error) {
            setError(data.error)
          } else {
            setAgent(data)
            setTagline(data.tagline ?? '')
            setDescription(data.description ?? '')
            setCategory(data.category ?? 'productivity')
            setTags((data.tags ?? []).join(', '))
            setIcon(data.icon_url ?? '')
          }
          setLoading(false)
        })
        .catch(() => {
          setError('Failed to load agent')
          setLoading(false)
        })
    })
  }, [params])

  function handleSave() {
    if (!agent) return
    setError(null)
    setSuccess(null)

    startTransition(async () => {
      const updates: Record<string, unknown> = {}
      if (tagline !== (agent.tagline ?? '')) updates.tagline = tagline
      if (description !== (agent.description ?? '')) updates.description = description
      if (category !== (agent.category ?? '')) updates.category = category
      const newTags = tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
      if (JSON.stringify(newTags) !== JSON.stringify(agent.tags ?? []))
        updates.tags = newTags
      if (icon !== (agent.icon_url ?? '')) updates.icon = icon || undefined

      if (Object.keys(updates).length === 0) {
        setSuccess('No changes to save')
        return
      }

      const result = await updateAgent(agent.slug, updates)
      if ('error' in result && result.error) {
        setError(result.error)
      } else {
        setSuccess('Agent updated successfully')
        router.refresh()
      }
    })
  }

  function handleTogglePublish() {
    if (!agent) return
    setError(null)
    setSuccess(null)

    startTransition(async () => {
      const result =
        agent.status === 'published'
          ? await unpublishAgent(agent.slug)
          : await republishAgent(agent.slug)

      if ('error' in result && result.error) {
        setError(result.error)
      } else {
        setSuccess(
          agent.status === 'published'
            ? 'Agent unpublished'
            : 'Agent republished'
        )
        router.refresh()
        // Reload agent data
        const slug = agent.slug
        const r = await fetch(`/api/agents/${slug}`)
        const data = await r.json()
        if (!data.error) setAgent(data)
      }
    })
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <p className="text-muted-foreground">Loading agent...</p>
      </div>
    )
  }

  if (error && !agent) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <p className="text-destructive">{error}</p>
      </div>
    )
  }

  if (!agent) return null

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/agents">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">
              {agent.name}
            </h1>
            <Badge
              variant={agent.status === 'published' ? 'default' : 'secondary'}
            >
              {agent.status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {agent.total_hires ?? 0} hires
            {agent.avg_rating != null && (
              <> · {Number(agent.avg_rating).toFixed(1)} avg rating</>
            )}
            {agent.github_repo_url && (
              <>
                {' · '}
                <a
                  href={agent.github_repo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 hover:underline"
                >
                  GitHub
                  <ExternalLink className="size-3" />
                </a>
              </>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={agent.status === 'published' ? 'outline' : 'default'}
            onClick={handleTogglePublish}
            disabled={isPending}
          >
            {agent.status === 'published' ? 'Unpublish' : 'Republish'}
          </Button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-md bg-emerald-500/10 px-4 py-3 text-sm text-emerald-600">
          {success}
        </div>
      )}

      {/* Edit form */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Listing Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="tagline">Tagline</Label>
              <Input
                id="tagline"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                maxLength={120}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                {tagline.length}/120 characters
              </p>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                maxLength={2000}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                {description.length}/2000 characters
              </p>
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c.charAt(0).toUpperCase() + c.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="automation, writing, research"
              />
            </div>

            <div>
              <Label htmlFor="icon">Icon URL</Label>
              <Input
                id="icon"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                placeholder="https://..."
              />
            </div>

            <Button onClick={handleSave} disabled={isPending}>
              <Save className="mr-2 size-4" />
              Save Changes
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Slug</span>
              <span className="font-mono">{agent.slug}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pricing</span>
              <span>
                {agent.pricing_model === 'free'
                  ? 'Free'
                  : `${agent.credits_per_session} credits / ${agent.pricing_model.replace('_', ' ')}`}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Published</span>
              <span>
                {agent.published_at
                  ? new Date(agent.published_at).toLocaleDateString()
                  : 'Not published'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Created</span>
              <span>{new Date(agent.created_at).toLocaleDateString()}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
