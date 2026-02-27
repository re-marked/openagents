'use client'

import { useState } from 'react'
import {
  LayoutDashboard,
  SlidersHorizontal,
  Heart,
  Puzzle,
  Brain,
  Settings,
  Power,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAgentStatus } from '@/hooks/use-agent-status'
import { OverviewSection } from './sections/overview-section'
import { ConfigSection } from './sections/config-section'
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

type Section = 'overview' | 'config' | 'personality' | 'skills' | 'memory' | 'actions'

interface NavItem {
  id: Section
  label: string
  icon: LucideIcon
}

const NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'config', label: 'Config', icon: SlidersHorizontal },
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
  const [activeSection, setActiveSection] = useState<Section>('overview')
  const [currentName, setCurrentName] = useState(displayName)

  const { status } = useAgentStatus({ instanceId, initialStatus })

  const isRunning = status === 'running'

  // Sections that require the machine to be running
  const requiresRunning = ['config', 'personality', 'skills', 'memory']
  const sectionNeedsWake = requiresRunning.includes(activeSection) && !isRunning

  // Sections that manage their own scroll (editor sections with inner ScrollArea)
  const fullHeightSections: Section[] = ['personality', 'memory']
  const isFullHeight = fullHeightSections.includes(activeSection)

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
      case 'config':
        return <ConfigSection instanceId={instanceId} />
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
        {/* Content area */}
        <div className="flex-1 min-w-0 min-h-0 flex flex-col">
          {isFullHeight ? (
            /* Editor sections (personality, memory) manage their own inner scroll */
            <div className="flex-1 min-h-0 p-6 flex flex-col">
              {renderSection()}
            </div>
          ) : (
            /* Non-editor sections scroll via outer ScrollArea */
            <ScrollArea className="flex-1 min-h-0">
              <div className="p-6">
                {renderSection()}
              </div>
            </ScrollArea>
          )}
        </div>
      </div>

      {/* macOS dock-style nav */}
      <div className="shrink-0 flex items-center justify-center border-t border-border/40 bg-background px-4 py-2">
        <div className="flex items-center gap-1 rounded-xl bg-muted/40 px-1.5 py-1.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive = activeSection === item.id
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="size-4" />
                <span className={isActive ? '' : 'hidden sm:inline'}>{item.label}</span>
              </button>
            )
          })}
        </div>
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
