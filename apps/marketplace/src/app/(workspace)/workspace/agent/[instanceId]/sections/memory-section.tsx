'use client'

import { useState, useEffect } from 'react'
import { Loader2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MarkdownEditor } from '@/components/markdown-editor'

const MEMORY_MD_PATH = '/data/workspace/MEMORY.md'
const MEMORY_DIR = '/data/memory'

interface MemoryFile {
  name: string
  content?: string
}

interface MemorySectionProps {
  instanceId: string
}

export function MemorySection({ instanceId }: MemorySectionProps) {
  const [tab, setTab] = useState<'memory-md' | 'memory-dir'>('memory-md')
  const [memoryMd, setMemoryMd] = useState('')
  const [originalMemoryMd, setOriginalMemoryMd] = useState('')
  const [memoryFiles, setMemoryFiles] = useState<MemoryFile[]>([])
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [selectedContent, setSelectedContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    loadMemory()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instanceId])

  async function loadMemory() {
    setLoading(true)
    try {
      const mdRes = await fetch(
        `/api/agent/files?instanceId=${instanceId}&path=${encodeURIComponent(MEMORY_MD_PATH)}`
      )
      if (mdRes.ok) {
        const data = await mdRes.json()
        setMemoryMd(data.content ?? '')
        setOriginalMemoryMd(data.content ?? '')
      }

      const dirRes = await fetch(
        `/api/agent/files?instanceId=${instanceId}&path=${encodeURIComponent(MEMORY_DIR)}&list=true`
      )
      if (dirRes.ok) {
        const data = await dirRes.json()
        const lines: string[] = (data.output ?? '').split('\n').filter(Boolean)
        const files = lines
          .map((line: string) => {
            const parts = line.trim().split(/\s+/)
            return parts[parts.length - 1]
          })
          .filter((name: string) => name !== '.' && name !== '..' && !name.startsWith('total'))
          .map((name: string) => ({ name }))
        setMemoryFiles(files)
      }
    } catch {
      // fail silently
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveMemoryMd() {
    setSaving(true)
    setSaved(false)
    try {
      const res = await fetch('/api/agent/files', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instanceId, path: MEMORY_MD_PATH, content: memoryMd }),
      })
      if (res.ok) {
        setOriginalMemoryMd(memoryMd)
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    } catch {
      // fail silently
    } finally {
      setSaving(false)
    }
  }

  async function handleViewFile(fileName: string) {
    setSelectedFile(fileName)
    setSelectedContent('')
    try {
      const res = await fetch(
        `/api/agent/files?instanceId=${instanceId}&path=${encodeURIComponent(`${MEMORY_DIR}/${fileName}`)}`
      )
      if (res.ok) {
        const data = await res.json()
        setSelectedContent(data.content ?? '')
      }
    } catch {
      setSelectedContent('(failed to load)')
    }
  }

  async function handleClearAll() {
    if (!confirm('Clear all auto-generated memory files? This cannot be undone.')) return
    for (const file of memoryFiles) {
      try {
        await fetch('/api/agent/files', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            instanceId,
            path: `${MEMORY_DIR}/${file.name}`,
            content: '',
          }),
        })
      } catch {
        // skip
      }
    }
    setMemoryFiles([])
    setSelectedFile(null)
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-12 justify-center text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        <span className="text-sm">Loading memory...</span>
      </div>
    )
  }

  const hasChanges = memoryMd !== originalMemoryMd

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="shrink-0">
        <h2 className="text-lg font-semibold tracking-tight">Memory</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your agent&apos;s long-term memory and auto-generated notes.
        </p>
      </div>

      {/* Tabs */}
      <div className="shrink-0 flex gap-1 border-b border-border/40">
        <button
          onClick={() => setTab('memory-md')}
          className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === 'memory-md'
              ? 'border-primary text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          MEMORY.md
        </button>
        <button
          onClick={() => setTab('memory-dir')}
          className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === 'memory-dir'
              ? 'border-primary text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          memory/ ({memoryFiles.length})
        </button>
      </div>

      {tab === 'memory-md' && (
        <>
          <p className="shrink-0 text-xs text-muted-foreground">
            Facts and context your agent remembers across conversations.
          </p>
          <div className="flex-1 min-h-0 rounded-xl border border-border/40 overflow-hidden">
            <MarkdownEditor value={memoryMd} onChange={setMemoryMd} />
          </div>
          <div className="shrink-0 flex items-center gap-3">
            <Button size="sm" onClick={handleSaveMemoryMd} disabled={!hasChanges || saving}>
              {saving && <Loader2 className="size-3 mr-1.5 animate-spin" />}
              {saved ? 'Saved' : 'Save'}
            </Button>
            {hasChanges && (
              <button
                onClick={() => setMemoryMd(originalMemoryMd)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Discard changes
              </button>
            )}
          </div>
        </>
      )}

      {tab === 'memory-dir' && (
        <div className="flex-1 min-h-0 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Auto-generated notes from conversations (read-only).
            </p>
            {memoryFiles.length > 0 && (
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive hover:text-destructive text-xs"
                onClick={handleClearAll}
              >
                <Trash2 className="size-3 mr-1" />
                Clear All
              </Button>
            )}
          </div>

          {memoryFiles.length === 0 ? (
            <div className="rounded-xl border border-border/40 bg-card/50 px-4 py-8 text-center">
              <p className="text-sm text-muted-foreground">No auto-generated notes yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2">
              {memoryFiles.map((file) => (
                <button
                  key={file.name}
                  onClick={() => handleViewFile(file.name)}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                    selectedFile === file.name
                      ? 'border-primary/50 bg-primary/5'
                      : 'border-border/40 bg-card/50 hover:bg-accent/30'
                  }`}
                >
                  <span className="font-mono text-xs truncate">{file.name}</span>
                </button>
              ))}
            </div>
          )}

          {selectedFile && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">{selectedFile}</p>
              <ScrollArea className="max-h-64 rounded-xl border border-border/40 bg-card/50">
                <pre className="px-4 py-3 text-xs font-mono text-foreground whitespace-pre-wrap">
                  {selectedContent || '(empty)'}
                </pre>
              </ScrollArea>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
