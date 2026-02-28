'use client'

import { useState, useEffect } from 'react'
import { Loader2, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MarkdownEditor } from '@/components/markdown-editor'

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
        <span className="text-sm">Loading soul...</span>
      </div>
    )
  }

  const hasChanges = content !== originalContent

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="shrink-0">
        <h2 className="text-lg font-semibold tracking-tight">Soul</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Edit your Agent&apos;s soul document. <strong>The soul document defines the Agent&apos;s personality, background, typical behavior and whatever makes the Agent unique.</strong>.
        </p>
      </div>

      <div className="flex-1 min-h-0 rounded-xl border border-border/40 overflow-hidden">
        <MarkdownEditor value={content} onChange={setContent} />
      </div>

      <div className="shrink-0 flex items-center gap-3">
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
