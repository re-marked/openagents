'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Loader2, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'

const SOUL_PATH = '/data/workspace/SOUL.md'

const DEFAULT_SOUL = `# Personality

You are a helpful, knowledgeable assistant. You communicate clearly and concisely.

## Tone
- Friendly but professional
- Direct and to the point
- Willing to ask clarifying questions

## Guidelines
- Always be honest about what you know and don't know
- Provide sources when possible
- Break complex topics into digestible pieces
`

interface PersonalitySectionProps {
  instanceId: string
}

export function PersonalitySection({ instanceId }: PersonalitySectionProps) {
  const [content, setContent] = useState('')
  const [originalContent, setOriginalContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const autoResize = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.max(el.scrollHeight, 300)}px`
  }, [])

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(
          `/api/agent/files?instanceId=${instanceId}&path=${encodeURIComponent(SOUL_PATH)}`
        )
        if (res.ok) {
          const data = await res.json()
          setContent(data.content ?? '')
          setOriginalContent(data.content ?? '')
        }
      } catch {
        // File may not exist yet
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [instanceId])

  useEffect(() => {
    autoResize()
  }, [content, loading, autoResize])

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    try {
      const res = await fetch('/api/agent/files', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instanceId, path: SOUL_PATH, content }),
      })
      if (res.ok) {
        setOriginalContent(content)
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    } catch {
      // fail silently
    } finally {
      setSaving(false)
    }
  }

  function handleReset() {
    setContent(DEFAULT_SOUL)
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-12 justify-center text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        <span className="text-sm">Loading personality...</span>
      </div>
    )
  }

  const hasChanges = content !== originalContent

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Personality</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Edit your Agent&apos;s soul document.
        </p>
        <p className="text-sm text-foregrou mt-1">
          The soul document defines the Agent&apos;s personality, background, typical behavior and whatever makes the Agent unique.
        </p>
      </div>

      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write your agent's personality here (Markdown supported)..."
        className="w-full min-h-[300px] rounded-xl border border-border/40 bg-card/50 px-4 py-3 text-sm font-mono text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring resize-none overflow-hidden"
        spellCheck={false}
      />

      <div className="flex items-center gap-3">
        <Button size="sm" onClick={handleSave} disabled={!hasChanges || saving}>
          {saving && <Loader2 className="size-3 mr-1.5 animate-spin" />}
          {saved ? 'Saved' : 'Save'}
        </Button>
        <Button size="sm" variant="outline" onClick={handleReset}>
          <RotateCcw className="size-3 mr-1.5" />
          Reset to Default
        </Button>
        {hasChanges && (
          <button
            onClick={() => setContent(originalContent)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Discard changes
          </button>
        )}
      </div>
    </div>
  )
}
