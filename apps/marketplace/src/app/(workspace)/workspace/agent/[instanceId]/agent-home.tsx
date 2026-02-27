'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Cpu,
  Heart,
  Puzzle,
  Brain,
  Settings,
  MessageSquare,
  Power,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAgentStatus } from '@/hooks/use-agent-status'
import { OverviewSection } from './sections/overview-section'
import { ModelSection } from './sections/model-section'
import { PersonalitySection } from './sections/personality-section'
import { SkillsSection } from './sections/skills-section'
import { MemorySection } from './sections/memory-section'
import { ActionsSection } from './sections/actions-section'

export const STATUS_CONFIG: Record<string, { label: string; dot: string; bg: string }> = {
  running: { label: 'Running', dot: 'bg-green-500', bg: 'bg-green-500/10 text-green-400 ring-green-500/20' },
  suspended: { label: 'Suspended', dot: 'bg-yellow-500', bg: 'bg-yellow-500/10 text-yellow-400 ring-yellow-500/20' },
  stopped: { label: 'Stopped', dot: 'bg-orange-500', bg: 'bg-orange-500/10 text-orange-400 ring-orange-500/20' },
  provisioning: { label: 'Provisioning', dot: 'bg-blue-500 animate-pulse', bg: 'bg-blue-500/10 text-blue-400 ring-blue-500/20' },
  error: { label: 'Error', dot: 'bg-red-500', bg: 'bg-red-500/10 text-red-400 ring-red-500/20' },
}

type Section = 'overview' | 'model' | 'personality' | 'skills' | 'memory' | 'actions'

interface NavItem {
  id: Section
  label: string
  icon: LucideIcon
}

const NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'model', label: 'Model', icon: Cpu },
  { id: 'personality', label: 'Personality', icon: Heart },
  { id: 'skills', label: 'Skills', icon: Puzzle },
  { id: 'memory', label: 'Memory', icon: Brain },
  { id: 'actions', label: 'Actions', icon: Settings },
]

export interface AgentHomeProps {
  instanceId: string
  initialStatus: string
  displayName: string
  agentName: string
  agentSlug: string
  agentCategory: string
  agentTagline: string | null
  agentIconUrl: string | null
  createdAt: string
}

export function AgentHomePage(props: AgentHomeProps) {
  const {
    instanceId,
    initialStatus,
    displayName,
  } = props
  const router = useRouter()
  const [activeSection, setActiveSection] = useState<Section>('overview')
  const [currentName, setCurrentName] = useState(displayName)

  const { status } = useAgentStatus({ instanceId, initialStatus })
  const cfg = STATUS_CONFIG[status] ?? {
    label: status,
    dot: 'bg-zinc-400',
    bg: 'bg-zinc-500/10 text-zinc-400 ring-zinc-500/20',
  }

  const isRunning = status === 'running'

  // Sections that require the machine to be running
  const requiresRunning = ['model', 'personality', 'skills', 'memory']
  const sectionNeedsWake = requiresRunning.includes(activeSection) && !isRunning

  function renderSection() {
    if (sectionNeedsWake) {
      return (
        <MachineRequiredBanner
          instanceId={instanceId}
          status={status}
        />
      )
    }

    switch (activeSection) {
      case 'overview':
        return (
          <OverviewSection
            {...props}
            status={status}
            currentName={currentName}
            onNameChange={setCurrentName}
          />
        )
      case 'model':
        return <ModelSection instanceId={instanceId} />
      case 'personality':
        return <PersonalitySection instanceId={instanceId} />
      case 'skills':
        return <SkillsSection instanceId={instanceId} />
      case 'memory':
        return <MemorySection instanceId={instanceId} />
      case 'actions':
        return (
          <ActionsSection
            instanceId={instanceId}
            agentName={currentName}
            status={status}
            onNameChange={setCurrentName}
          />
        )
    }
  }

  return (
    <div className="flex flex-1 min-h-0 flex-col">
      {/* Main content area with secondary sidebar */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Secondary sidebar */}
        <nav className="hidden md:flex w-52 shrink-0 flex-col border-r border-border/40 bg-background">
          <div className="flex flex-col gap-0.5 p-3 flex-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon
              const isActive = activeSection === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors text-left ${
                    isActive
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                  }`}
                >
                  <Icon className="size-4 shrink-0" />
                  {item.label}
                </button>
              )
            })}
          </div>
        </nav>

        {/* Mobile nav */}
        <div className="md:hidden flex gap-1 px-3 py-2 border-b border-border/40 overflow-x-auto shrink-0 bg-background">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive = activeSection === item.id
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-accent/50'
                }`}
              >
                <Icon className="size-3.5" />
                {item.label}
              </button>
            )
          })}
        </div>

        {/* Content area */}
        <div className="flex-1 min-w-0 overflow-y-auto">
          <div className="p-6 max-w-3xl">
            {renderSection()}
          </div>
        </div>
      </div>

      {/* Persistent bottom bar */}
      <div className="shrink-0 flex items-center justify-between border-t border-border/40 bg-background px-4 py-3">
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${cfg.bg}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
          </span>
          <span className="text-xs text-muted-foreground">{currentName}</span>
        </div>
        <Button
          size="sm"
          onClick={() => router.push(`/workspace/agent/${instanceId}/chat`)}
          disabled={!isRunning && status !== 'suspended' && status !== 'stopped'}
        >
          <MessageSquare className="size-3.5 mr-1.5" />
          Open Chat
        </Button>
      </div>
    </div>
  )
}

function MachineRequiredBanner({
  instanceId,
  status,
}: {
  instanceId: string
  status: string
}) {
  const [waking, setWaking] = useState(false)

  async function handleWake() {
    setWaking(true)
    try {
      await fetch('/api/agent/wake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentInstanceId: instanceId }),
      })
    } catch {
      // Status polling will pick up the change
    } finally {
      setWaking(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
        <Power className="size-6 text-muted-foreground" />
      </div>
      <div>
        <h3 className="text-sm font-medium">Agent is {status}</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Start your agent to access this setting
        </p>
      </div>
      {(status === 'suspended' || status === 'stopped') && (
        <Button size="sm" onClick={handleWake} disabled={waking}>
          {waking ? 'Starting...' : status === 'stopped' ? 'Start Up' : 'Wake Up'}
        </Button>
      )}
    </div>
  )
}
