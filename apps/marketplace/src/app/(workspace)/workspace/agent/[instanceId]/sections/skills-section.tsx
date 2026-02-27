'use client'

import { useState, useEffect } from 'react'
import { Loader2, Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const SKILLS_DIR = '/data/workspace/skills'

const SKILL_TEMPLATE = `---
name: new-skill
description: A new skill for the agent
parameters: []
---

# Instructions

Describe what this skill does and how the agent should use it.
`

interface Skill {
  name: string
  content: string
}

interface SkillsSectionProps {
  instanceId: string
}

export function SkillsSection({ instanceId }: SkillsSectionProps) {
  const [skills, setSkills] = useState<Skill[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [newSkillName, setNewSkillName] = useState('')

  useEffect(() => {
    loadSkills()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instanceId])

  async function loadSkills() {
    setLoading(true)
    try {
      // List skill directories
      const res = await fetch(
        `/api/agent/files?instanceId=${instanceId}&path=${encodeURIComponent(SKILLS_DIR)}&list=true`
      )
      if (!res.ok) {
        setLoading(false)
        return
      }
      const data = await res.json()
      const lines: string[] = (data.output ?? '').split('\n').filter(Boolean)

      // Parse directory names (skip . and ..)
      const dirs = lines
        .map((line: string) => {
          const parts = line.trim().split(/\s+/)
          return parts[parts.length - 1]
        })
        .filter((name: string) => name !== '.' && name !== '..' && name !== 'total' && !name.startsWith('total'))

      // Load each skill's SKILL.md
      const loaded: Skill[] = []
      for (const dir of dirs) {
        try {
          const skillRes = await fetch(
            `/api/agent/files?instanceId=${instanceId}&path=${encodeURIComponent(`${SKILLS_DIR}/${dir}/SKILL.md`)}`
          )
          if (skillRes.ok) {
            const skillData = await skillRes.json()
            loaded.push({ name: dir, content: skillData.content ?? '' })
          }
        } catch {
          // Skip unreadable skills
        }
      }
      setSkills(loaded)
    } catch {
      // fail silently
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveSkill(skillName: string) {
    const content = editingContent[skillName]
    if (content === undefined) return

    setSaving(skillName)
    try {
      const res = await fetch('/api/agent/files', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instanceId,
          path: `${SKILLS_DIR}/${skillName}/SKILL.md`,
          content,
        }),
      })
      if (res.ok) {
        setSkills((prev) =>
          prev.map((s) => (s.name === skillName ? { ...s, content } : s))
        )
        setEditingContent((prev) => {
          const next = { ...prev }
          delete next[skillName]
          return next
        })
      }
    } catch {
      // fail silently
    } finally {
      setSaving(null)
    }
  }

  async function handleAddSkill() {
    const name = newSkillName.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    if (!name) return

    setAdding(true)
    try {
      // Create the directory + SKILL.md
      const content = SKILL_TEMPLATE.replace('new-skill', name)
      // First create the dir
      await fetch('/api/agent/files', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instanceId,
          path: `${SKILLS_DIR}/${name}/SKILL.md`,
          content,
        }),
      })
      // Mkdir may be needed — use exec to ensure dir exists first
      setSkills((prev) => [...prev, { name, content }])
      setNewSkillName('')
      setExpanded(name)
    } catch {
      // fail silently
    } finally {
      setAdding(false)
    }
  }

  async function handleDeleteSkill(skillName: string) {
    try {
      // Remove the skill directory by deleting SKILL.md and the dir
      await fetch('/api/agent/files', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instanceId,
          path: `${SKILLS_DIR}/${skillName}/SKILL.md`,
          content: '', // Clear the file
        }),
      })
      setSkills((prev) => prev.filter((s) => s.name !== skillName))
      if (expanded === skillName) setExpanded(null)
    } catch {
      // fail silently
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-12 justify-center text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        <span className="text-sm">Loading skills...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Skills</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your agent&apos;s skills. Each skill is a SKILL.md file with YAML frontmatter and instructions.
        </p>
      </div>

      {/* Skills list */}
      {skills.length === 0 ? (
        <div className="rounded-xl border border-border/40 bg-card/50 px-4 py-8 text-center">
          <p className="text-sm text-muted-foreground">No skills installed yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {skills.map((skill) => {
            const isExpanded = expanded === skill.name
            const isEditing = editingContent[skill.name] !== undefined
            const displayContent = editingContent[skill.name] ?? skill.content
            return (
              <div
                key={skill.name}
                className="rounded-xl border border-border/40 bg-card/50 overflow-hidden"
              >
                <button
                  onClick={() => setExpanded(isExpanded ? null : skill.name)}
                  className="flex items-center gap-2 w-full px-4 py-3 text-left hover:bg-accent/30 transition-colors"
                >
                  {isExpanded ? (
                    <ChevronDown className="size-4 text-muted-foreground shrink-0" />
                  ) : (
                    <ChevronRight className="size-4 text-muted-foreground shrink-0" />
                  )}
                  <span className="text-sm font-medium font-mono">{skill.name}</span>
                </button>

                {isExpanded && (
                  <div className="border-t border-border/40 p-4 space-y-3">
                    <textarea
                      value={displayContent}
                      onChange={(e) =>
                        setEditingContent((prev) => ({
                          ...prev,
                          [skill.name]: e.target.value,
                        }))
                      }
                      className="w-full h-[280px] rounded-lg border border-border/40 bg-background px-3 py-2 text-sm font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                      spellCheck={false}
                    />
                    <div className="flex items-center gap-2">
                      {isEditing && (
                        <Button
                          size="sm"
                          onClick={() => handleSaveSkill(skill.name)}
                          disabled={saving === skill.name}
                        >
                          {saving === skill.name && (
                            <Loader2 className="size-3 mr-1.5 animate-spin" />
                          )}
                          Save
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDeleteSkill(skill.name)}
                      >
                        <Trash2 className="size-3 mr-1.5" />
                        Delete
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Add skill */}
      <div className="flex items-center gap-2">
        <Input
          value={newSkillName}
          onChange={(e) => setNewSkillName(e.target.value)}
          placeholder="Skill name (e.g. web-search)"
          className="max-w-xs text-sm"
          onKeyDown={(e) => e.key === 'Enter' && handleAddSkill()}
        />
        <Button
          size="sm"
          variant="outline"
          onClick={handleAddSkill}
          disabled={!newSkillName.trim() || adding}
        >
          {adding ? (
            <Loader2 className="size-3 mr-1.5 animate-spin" />
          ) : (
            <Plus className="size-3 mr-1.5" />
          )}
          Add Skill
        </Button>
      </div>
    </div>
  )
}

