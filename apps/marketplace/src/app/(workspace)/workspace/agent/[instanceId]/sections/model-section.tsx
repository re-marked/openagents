'use client'

import { useState, useEffect } from 'react'
import { Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

const MODELS = [
  { id: 'google/gemini-2.5-flash', label: 'Gemini 2.5 Flash', provider: 'google' },
  { id: 'google/gemini-2.5-pro', label: 'Gemini 2.5 Pro', provider: 'google' },
  { id: 'anthropic/claude-sonnet-4-5-20250929', label: 'Claude Sonnet 4.5', provider: 'anthropic' },
  { id: 'anthropic/claude-haiku-4-5', label: 'Claude Haiku 4.5', provider: 'anthropic' },
  { id: 'openai/gpt-4o', label: 'GPT-4o', provider: 'openai' },
  { id: 'openai/o3-mini', label: 'o3-mini', provider: 'openai' },
]

const PROVIDER_COLORS: Record<string, string> = {
  google: 'bg-blue-500/10 text-blue-400 ring-blue-500/20',
  anthropic: 'bg-amber-500/10 text-amber-400 ring-amber-500/20',
  openai: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20',
}

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
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Primary Model</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Choose the LLM your agent uses. The model can be changed at any time.
        </p>
      </div>

      <div className="grid gap-2">
        {MODELS.map((model) => {
          const isSelected = selectedModel === model.id
          const providerColor = PROVIDER_COLORS[model.provider] ?? ''
          return (
            <button
              key={model.id}
              onClick={() => setSelectedModel(model.id)}
              className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
                isSelected
                  ? 'border-primary/50 bg-primary/5'
                  : 'border-border/40 bg-card/50 hover:bg-accent/50'
              }`}
            >
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${isSelected ? 'bg-primary/20' : 'bg-muted'}`}>
                {isSelected && <Check className="size-4 text-primary" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{model.label}</p>
                <p className="text-xs text-muted-foreground font-mono">{model.id}</p>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset ${providerColor}`}>
                {model.provider}
              </span>
            </button>
          )
        })}
      </div>

      <div className="flex items-center gap-3">
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
