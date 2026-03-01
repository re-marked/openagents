'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  LayoutDashboard,
  SlidersHorizontal,
  Heart,
  Puzzle,
  Brain,
  Settings,
  Power,
  BarChart3,
  Activity,
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
import { UsageSection } from './sections/usage-section'
import { ActivitySection } from './sections/activity-section'

export const STATUS_CONFIG: Record<string, { label: string; dot: string; bg: string }> = {
  running: { label: 'Running', dot: 'bg-status-running', bg: 'bg-status-running/10 text-status-running ring-status-running/20' },
  starting: { label: 'Starting up...', dot: 'bg-status-provisioning animate-pulse', bg: 'bg-status-provisioning/10 text-status-provisioning ring-status-provisioning/20' },
  suspended: { label: 'Suspended', dot: 'bg-status-suspended', bg: 'bg-status-suspended/10 text-status-suspended ring-status-suspended/20' },
  stopped: { label: 'Stopped', dot: 'bg-status-stopped', bg: 'bg-status-stopped/10 text-status-stopped ring-status-stopped/20' },
  provisioning: { label: 'Provisioning', dot: 'bg-status-provisioning animate-pulse', bg: 'bg-status-provisioning/10 text-status-provisioning ring-status-provisioning/20' },
  error: { label: 'Error', dot: 'bg-status-error', bg: 'bg-status-error/10 text-status-error ring-status-error/20' },
}

type Section = 'overview' | 'config' | 'personality' | 'skills' | 'memory' | 'usage' | 'activity' | 'actions'

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
  { id: 'usage', label: 'Usage', icon: BarChart3 },
  { id: 'activity', label: 'Activity', icon: Activity },
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
  testMode?: boolean
}

export function AgentHomePage(props: AgentHomeProps) {
  const {
    instanceId,
    initialStatus,
    displayName,
    testMode = false,
  } = props
  const [activeSection, setActiveSection] = useState<Section>('overview')
  const [currentName, setCurrentName] = useState(displayName)
  const [waking, setWaking] = useState(false)

  const { status: realStatus } = useAgentStatus({ instanceId, initialStatus })
  // In test mode, always show as running so all sections are accessible
  const polledStatus = testMode ? 'running' : realStatus

  // Clear waking once polling confirms running
  useEffect(() => {
    if (polledStatus === 'running' && waking) setWaking(false)
  }, [polledStatus, waking])

  // Effective status: show "starting" while waiting for machine to come up
  const status = waking ? 'starting' : polledStatus
  const isRunning = status === 'running'

  const handleWake = useCallback(async () => {
    setWaking(true)
    try {
      await fetch('/api/agent/wake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentInstanceId: instanceId }),
      })
    } catch {
      setWaking(false)
    }
  }, [instanceId])

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
          status={status}
          onWake={handleWake}
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
            onNavigate={(s) => setActiveSection(s as Section)}
            onWake={handleWake}
            testMode={testMode}
          />
        )
      case 'config':
        return <ConfigSection instanceId={instanceId} agentName={currentName} />
      case 'personality':
        return <PersonalitySection instanceId={instanceId} testMode={testMode} />
      case 'skills':
        return <SkillsSection instanceId={instanceId} testMode={testMode} />
      case 'memory':
        return <MemorySection instanceId={instanceId} testMode={testMode} />
      case 'usage':
        return <UsageSection instanceId={instanceId} testMode={testMode} />
      case 'activity':
        return <ActivitySection instanceId={instanceId} testMode={testMode} />
      case 'actions':
        return (
          <ActionsSection
            instanceId={instanceId}
            agentName={currentName}
            agentSlug={props.agentSlug}
            status={status}
            onNameChange={setCurrentName}
            onWake={handleWake}
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
  status,
  onWake,
}: {
  status: string
  onWake: () => void
}) {
  const isStarting = status === 'starting'
  const canWake = status === 'suspended' || status === 'stopped'

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
        <Power className="size-6 text-muted-foreground" />
      </div>
      <div>
        <h3 className="text-sm font-medium">
          Agent is {isStarting ? 'starting up' : status}
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          {isStarting ? 'Please wait while your agent boots up...' : 'Start your agent to access this setting'}
        </p>
      </div>
      {canWake && (
        <Button size="sm" onClick={onWake}>
          {status === 'stopped' ? 'Start Up' : 'Wake Up'}
        </Button>
      )}
      {isStarting && (
        <div className="flex items-center gap-2 text-sm text-status-provisioning">
          <span className="h-2 w-2 rounded-full bg-status-provisioning animate-pulse" />
          Starting up...
          
        </div>
      )}
    </div>
  )
}
