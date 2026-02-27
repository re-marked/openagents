'use client'

import { useState, useEffect } from 'react'
import { Check, Loader2, Sparkles, Zap, Cpu } from 'lucide-react'
import { Button } from '@/components/ui/button'

// ── Model data ───────────────────────────────────────────────────────────

interface ModelDef {
  id: string
  label: string
  provider: string
  tier: 'fast' | 'balanced' | 'powerful'
  description: string
}

const MODELS: ModelDef[] = [
  {
    id: 'google/gemini-2.5-flash',
    label: 'Gemini 2.5 Flash',
    provider: 'google',
    tier: 'fast',
    description: 'Fastest response times, great for quick tasks',
  },
  {
    id: 'google/gemini-2.5-pro',
    label: 'Gemini 2.5 Pro',
    provider: 'google',
    tier: 'powerful',
    description: 'Advanced reasoning with large context window',
  },
  {
    id: 'anthropic/claude-sonnet-4-5-20250929',
    label: 'Claude Sonnet 4.5',
    provider: 'anthropic',
    tier: 'balanced',
    description: 'Best balance of speed, quality, and cost',
  },
  {
    id: 'anthropic/claude-haiku-4-5',
    label: 'Claude Haiku 4.5',
    provider: 'anthropic',
    tier: 'fast',
    description: 'Lightweight and snappy for simple tasks',
  },
  {
    id: 'openai/gpt-4o',
    label: 'GPT-4o',
    provider: 'openai',
    tier: 'balanced',
    description: 'Versatile multimodal model with strong coding',
  },
  {
    id: 'openai/o3-mini',
    label: 'o3-mini',
    provider: 'openai',
    tier: 'fast',
    description: 'Efficient reasoning model, cost-effective',
  },
]

const PROVIDER_STYLES: Record<string, { accent: string; badge: string; glow: string }> = {
  google: {
    accent: 'border-l-blue-500',
    badge: 'bg-blue-500/10 text-blue-400',
    glow: 'shadow-blue-500/10',
  },
  anthropic: {
    accent: 'border-l-amber-500',
    badge: 'bg-amber-500/10 text-amber-400',
    glow: 'shadow-amber-500/10',
  },
  openai: {
    accent: 'border-l-emerald-500',
    badge: 'bg-emerald-500/10 text-emerald-400',
    glow: 'shadow-emerald-500/10',
  },
}

const TIER_ICON = {
  fast: Zap,
  balanced: Cpu,
  powerful: Sparkles,
} as const

const TIER_LABEL = {
  fast: 'Fast',
  balanced: 'Balanced',
  powerful: 'Powerful',
} as const

// ── Component ────────────────────────────────────────────────────────────

interface ModelSectionProps {
  instanceId: string
}

export function ModelSection({ instanceId }: ModelSectionProps) {
  const [currentModel, setCurrentModel] = useState<string | null>(null)
  const [selectedModel, setSelectedModel] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/agent/model?instanceId=${instanceId}`)
        if (res.ok) {
          const data = await res.json()
          setCurrentModel(data.model)
          setSelectedModel(data.model)
        }
      } catch {
        // fail silently
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [instanceId])

  async function handleSave() {
    if (!selectedModel || selectedModel === currentModel) return
    setSaving(true)
    setSaved(false)
    try {
      const res = await fetch('/api/agent/model', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instanceId, model: selectedModel }),
      })
      if (res.ok) {
        setCurrentModel(selectedModel)
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    } catch {
      // fail silently
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-12 justify-center text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        <span className="text-sm">Loading model config...</span>
      </div>
    )
  }

  const hasChanges = selectedModel !== currentModel

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Primary Model</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Choose the LLM your agent uses. The model can be changed at any time.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {MODELS.map((model) => {
          const isSelected = selectedModel === model.id
          const isCurrent = currentModel === model.id
          const styles = PROVIDER_STYLES[model.provider]
          const TierIcon = TIER_ICON[model.tier]

          return (
            <button
              key={model.id}
              onClick={() => setSelectedModel(model.id)}
              className={`group relative flex flex-col rounded-xl border-l-[3px] border border-border/40 px-4 py-4 text-left transition-all ${
                styles.accent
              } ${
                isSelected
                  ? `bg-card ring-1 ring-primary/30 shadow-lg ${styles.glow}`
                  : 'bg-card/40 hover:bg-card/70'
              }`}
            >
              {/* Header row */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold truncate">{model.label}</p>
                    {isCurrent && !hasChanges && (
                      <span className="text-[10px] text-muted-foreground/60 font-medium">current</span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground/60 font-mono mt-0.5">{model.id}</p>
                </div>

                {/* Selection indicator */}
                <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                  isSelected
                    ? 'border-primary bg-primary'
                    : 'border-muted-foreground/30 group-hover:border-muted-foreground/50'
                }`}>
                  {isSelected && <Check className="size-3 text-primary-foreground" />}
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{model.description}</p>

              {/* Footer */}
              <div className="flex items-center gap-2 mt-3">
                <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium ${styles.badge}`}>
                  {model.provider}
                </span>
                <span className="inline-flex items-center gap-1 rounded-md bg-muted/50 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                  <TierIcon className="size-2.5" />
                  {TIER_LABEL[model.tier]}
                </span>
              </div>
            </button>
          )
        })}
      </div>

      {/* Save bar */}
      <div className={`flex items-center gap-3 transition-opacity ${hasChanges ? 'opacity-100' : 'opacity-40'}`}>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={!hasChanges || saving}
        >
          {saving && <Loader2 className="size-3 mr-1.5 animate-spin" />}
          {saved ? 'Saved' : 'Save Changes'}
        </Button>
        {hasChanges && (
          <button
            onClick={() => setSelectedModel(currentModel)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Reset
          </button>
        )}
      </div>
    </div>
  )
}
