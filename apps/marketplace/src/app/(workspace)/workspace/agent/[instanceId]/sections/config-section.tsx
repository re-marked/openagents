'use client'

import { useState, useRef, useCallback } from 'react'
import {
  Loader2,
  RotateCcw,
  ShieldCheck,
  ShieldAlert,
  ShieldOff,
  FolderLock,
  FolderOpen,
  FolderEdit,
  Globe,
  GlobeLock,
  MessageCircleQuestion,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { RemoveAgentButton } from '@/components/remove-agent-button'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// ── Model data ──────────────────────────────────────────────────────────

interface ModelOption {
  id: string
  label: string
  provider: string
}

const MODELS: ModelOption[] = [
  { id: 'google/gemini-2.5-flash', label: 'Gemini 2.5 Flash', provider: 'Google' },
  { id: 'google/gemini-2.5-pro', label: 'Gemini 2.5 Pro', provider: 'Google' },
  { id: 'anthropic/claude-sonnet-4-5-20250929', label: 'Claude Sonnet 4.5', provider: 'Anthropic' },
  { id: 'anthropic/claude-haiku-4-5', label: 'Claude Haiku 4.5', provider: 'Anthropic' },
  { id: 'openai/gpt-4o', label: 'GPT-4o', provider: 'OpenAI' },
  { id: 'openai/o3-mini', label: 'o3-mini', provider: 'OpenAI' },
]

const MODEL_GROUPS = [
  { provider: 'Google', models: MODELS.filter((m) => m.provider === 'Google') },
  { provider: 'Anthropic', models: MODELS.filter((m) => m.provider === 'Anthropic') },
  { provider: 'OpenAI', models: MODELS.filter((m) => m.provider === 'OpenAI') },
]

// ── Config shape ────────────────────────────────────────────────────────

interface AgentConfig {
  // Model
  primaryModel: string
  // Safety
  toolApproval: 'restrict' | 'ask' | 'auto'
  fileAccess: 'none' | 'read' | 'full'
  webBrowsing: 'off' | 'ask' | 'on'
  // Responses
  responseLength: 'brief' | 'balanced' | 'thorough'
  streaming: boolean
  responseFormat: 'rich' | 'plain'
  // Context & Memory
  rememberConversations: boolean
  learnFromCorrections: boolean
  contextSize: 'standard' | 'extended' | 'maximum'
  // Limits
  monthlyBudget: string
  maxResponseLength: 'short' | 'standard' | 'long' | 'unlimited'
  dailyMessageLimit: string
  // Notifications
  notifyTaskComplete: boolean
  notifyErrors: boolean
  notifyBudgetWarning: boolean
}

const DEFAULT_CONFIG: AgentConfig = {
  primaryModel: 'google/gemini-2.5-flash',
  toolApproval: 'ask',
  fileAccess: 'read',
  webBrowsing: 'ask',
  responseLength: 'balanced',
  streaming: true,
  responseFormat: 'rich',
  rememberConversations: true,
  learnFromCorrections: true,
  contextSize: 'standard',
  monthlyBudget: '10',
  maxResponseLength: 'standard',
  dailyMessageLimit: '100',
  notifyTaskComplete: true,
  notifyErrors: true,
  notifyBudgetWarning: true,
}

// ── Setting Row ─────────────────────────────────────────────────────────

function SettingRow({
  label,
  description,
  children,
}: {
  label: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-8 py-2.5">
      <div className="min-w-0 flex-1">
        <Label className="text-sm font-medium">{label}</Label>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</p>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

// ── Card Picker (for Safety) ────────────────────────────────────────────

interface CardOption<T extends string> {
  value: T
  label: string
  description: string
  icon: React.ReactNode
  tone: 'green' | 'yellow' | 'red' | 'blue' | 'neutral'
}

const TONE_STYLES = {
  green: {
    active: 'border-emerald-500/50 bg-emerald-500/5 ring-1 ring-emerald-500/20',
    icon: 'text-emerald-400',
    dot: 'bg-emerald-500',
  },
  yellow: {
    active: 'border-amber-500/50 bg-amber-500/5 ring-1 ring-amber-500/20',
    icon: 'text-amber-400',
    dot: 'bg-amber-500',
  },
  red: {
    active: 'border-red-500/50 bg-red-500/5 ring-1 ring-red-500/20',
    icon: 'text-red-400',
    dot: 'bg-red-500',
  },
  blue: {
    active: 'border-primary/50 bg-primary/5 ring-1 ring-primary/20',
    icon: 'text-primary',
    dot: 'bg-primary',
  },
  neutral: {
    active: 'border-border bg-muted/30 ring-1 ring-border',
    icon: 'text-muted-foreground',
    dot: 'bg-muted-foreground',
  },
}

function CardPicker<T extends string>({
  options,
  value,
  onChange,
}: {
  options: CardOption<T>[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {options.map((opt) => {
        const isActive = value === opt.value
        const tone = TONE_STYLES[opt.tone]
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`relative flex flex-col items-start gap-2 rounded-xl border px-4 py-3.5 text-left transition-all ${
              isActive
                ? tone.active
                : 'border-border/40 bg-card/30 hover:bg-card/60 hover:border-border/60'
            }`}
          >
            <div className={`${isActive ? tone.icon : 'text-muted-foreground/50'} transition-colors`}>
              {opt.icon}
            </div>
            <div>
              <p className="text-sm font-medium">{opt.label}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{opt.description}</p>
            </div>
            {isActive && (
              <div className={`absolute top-3 right-3 size-2 rounded-full ${tone.dot}`} />
            )}
          </button>
        )
      })}
    </div>
  )
}

// ── Section Header ──────────────────────────────────────────────────────

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
    </div>
  )
}

// ── Main Component ──────────────────────────────────────────────────────

interface ConfigSectionProps {
  instanceId: string
  agentName: string
}

export function ConfigSection({ instanceId, agentName }: ConfigSectionProps) {
  const [config, setConfig] = useState<AgentConfig>({ ...DEFAULT_CONFIG })
  const initialConfig = useRef<AgentConfig>({ ...DEFAULT_CONFIG })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const hasChanges = JSON.stringify(config) !== JSON.stringify(initialConfig.current)

  const update = useCallback(<K extends keyof AgentConfig>(key: K, value: AgentConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }))
    setSaved(false)
  }, [])

  function handleReset() {
    setConfig({ ...initialConfig.current })
    setSaved(false)
  }

  async function handleSave() {
    setSaving(true)
    // Future: PUT to API with config payload
    await new Promise((r) => setTimeout(r, 400))
    initialConfig.current = { ...config }
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const selectedModel = MODELS.find((m) => m.id === config.primaryModel)

  const toolApprovalOptions: CardOption<'restrict' | 'ask' | 'auto'>[] = [
    {
      value: 'restrict',
      label: 'Restrict',
      description: 'Block all tool usage. Agent can only chat.',
      icon: <ShieldCheck className="size-5" />,
      tone: 'green',
    },
    {
      value: 'ask',
      label: 'Ask first',
      description: 'Agent asks for your approval before running any tool.',
      icon: <ShieldAlert className="size-5" />,
      tone: 'yellow',
    },
    {
      value: 'auto',
      label: 'Auto-approve',
      description: 'Agent runs tools freely without asking. Use with caution.',
      icon: <ShieldOff className="size-5" />,
      tone: 'red',
    },
  ]

  const fileAccessOptions: CardOption<'none' | 'read' | 'full'>[] = [
    {
      value: 'none',
      label: 'No access',
      description: "Agent can't read or write any files.",
      icon: <FolderLock className="size-5" />,
      tone: 'green',
    },
    {
      value: 'read',
      label: 'Read only',
      description: 'Agent can read files but not create or modify them.',
      icon: <FolderOpen className="size-5" />,
      tone: 'yellow',
    },
    {
      value: 'full',
      label: 'Full access',
      description: 'Agent can read, create, and edit files in its workspace.',
      icon: <FolderEdit className="size-5" />,
      tone: 'red',
    },
  ]

  const webBrowsingOptions: CardOption<'off' | 'ask' | 'on'>[] = [
    {
      value: 'off',
      label: 'Disabled',
      description: 'Agent cannot access the internet at all.',
      icon: <GlobeLock className="size-5" />,
      tone: 'green',
    },
    {
      value: 'ask',
      label: 'Ask first',
      description: 'Agent will ask before visiting any website.',
      icon: <MessageCircleQuestion className="size-5" />,
      tone: 'yellow',
    },
    {
      value: 'on',
      label: 'Allowed',
      description: 'Agent can browse the web freely to find information.',
      icon: <Globe className="size-5" />,
      tone: 'red',
    },
  ]

  return (
    <div className="space-y-8">
      {/* ── 1. Model ──────────────────────────────────── */}
      <div className="space-y-3">
        <SectionHeader
          title="Model"
          description="Choose which AI model powers your agent."
        />
        <SettingRow label="Primary Model" description="Affects speed, quality, and cost of every response.">
          <Select value={config.primaryModel} onValueChange={(v) => update('primaryModel', v)}>
            <SelectTrigger className="w-[220px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MODEL_GROUPS.map((group) => (
                <SelectGroup key={group.provider}>
                  <SelectLabel>{group.provider}</SelectLabel>
                  {group.models.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      <span className="flex items-center gap-2">
                        {model.label}
                        <span className="text-[10px] text-muted-foreground font-medium opacity-60">
                          {model.provider}
                        </span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>
        </SettingRow>
        {selectedModel && (
          <p className="text-[11px] font-mono text-muted-foreground/40 pl-0.5">
            {selectedModel.id}
          </p>
        )}
      </div>

      <Separator />

      {/* ── 2. Safety & Permissions ───────────────────── */}
      <div className="space-y-5">
        <SectionHeader
          title="Safety & Permissions"
          description="Control what your agent is allowed to do. Stricter settings are safer but less autonomous."
        />

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground uppercase tracking-wider">Tool Usage</Label>
          <CardPicker options={toolApprovalOptions} value={config.toolApproval} onChange={(v) => update('toolApproval', v)} />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground uppercase tracking-wider">File Access</Label>
          <CardPicker options={fileAccessOptions} value={config.fileAccess} onChange={(v) => update('fileAccess', v)} />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground uppercase tracking-wider">Web Browsing</Label>
          <CardPicker options={webBrowsingOptions} value={config.webBrowsing} onChange={(v) => update('webBrowsing', v)} />
        </div>
      </div>

      <Separator />

      {/* ── 3. Responses ──────────────────────────────── */}
      <div className="space-y-3">
        <SectionHeader
          title="Responses"
          description="Adjust how your agent communicates with you."
        />
        <SettingRow label="Response Length" description="How detailed your agent's answers are.">
          <Select value={config.responseLength} onValueChange={(v) => update('responseLength', v as AgentConfig['responseLength'])}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="brief">Brief</SelectItem>
              <SelectItem value="balanced">Balanced</SelectItem>
              <SelectItem value="thorough">Thorough</SelectItem>
            </SelectContent>
          </Select>
        </SettingRow>
        <SettingRow label="Live Streaming" description="See words appear as the agent types them.">
          <Switch
            checked={config.streaming}
            onCheckedChange={(v) => update('streaming', v)}
          />
        </SettingRow>
        <SettingRow label="Rich Formatting" description="Allow markdown, code blocks, and tables in responses.">
          <Switch
            checked={config.responseFormat === 'rich'}
            onCheckedChange={(v) => update('responseFormat', v ? 'rich' : 'plain')}
          />
        </SettingRow>
      </div>

      <Separator />

      {/* ── 4. Context & Memory ───────────────────────── */}
      <div className="space-y-3">
        <SectionHeader
          title="Context & Memory"
          description="What your agent remembers between conversations."
        />
        <SettingRow label="Remember Conversations" description="Keep chat history so the agent can refer back to earlier messages.">
          <Switch
            checked={config.rememberConversations}
            onCheckedChange={(v) => update('rememberConversations', v)}
          />
        </SettingRow>
        <SettingRow label="Learn from Corrections" description="When you correct the agent, it adapts its behavior going forward.">
          <Switch
            checked={config.learnFromCorrections}
            onCheckedChange={(v) => update('learnFromCorrections', v)}
          />
        </SettingRow>
        <SettingRow label="Context Window" description="How much conversation history the agent can see at once.">
          <Select value={config.contextSize} onValueChange={(v) => update('contextSize', v as AgentConfig['contextSize'])}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="standard">Standard</SelectItem>
              <SelectItem value="extended">Extended</SelectItem>
              <SelectItem value="maximum">Maximum</SelectItem>
            </SelectContent>
          </Select>
        </SettingRow>
      </div>

      <Separator />

      {/* ── 5. Limits ─────────────────────────────────── */}
      <div className="space-y-3">
        <SectionHeader
          title="Limits"
          description="Set guardrails on spending and usage to avoid surprises."
        />
        <SettingRow label="Monthly Budget" description="Pause the agent if this dollar amount is exceeded.">
          <div className="flex items-center gap-1.5">
            <span className="text-sm text-muted-foreground">$</span>
            <Input
              type="number"
              min="1"
              value={config.monthlyBudget}
              onChange={(e) => update('monthlyBudget', e.target.value)}
              className="w-[80px] h-9 text-sm"
            />
          </div>
        </SettingRow>
        <SettingRow label="Max Response Length" description="Cap how long a single reply can be.">
          <Select value={config.maxResponseLength} onValueChange={(v) => update('maxResponseLength', v as AgentConfig['maxResponseLength'])}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="short">Short (~500 words)</SelectItem>
              <SelectItem value="standard">Standard (~2k words)</SelectItem>
              <SelectItem value="long">Long (~5k words)</SelectItem>
              <SelectItem value="unlimited">Unlimited</SelectItem>
            </SelectContent>
          </Select>
        </SettingRow>
        <SettingRow label="Daily Message Limit" description="Max messages per day. Set 0 for unlimited.">
          <Input
            type="number"
            min="0"
            value={config.dailyMessageLimit}
            onChange={(e) => update('dailyMessageLimit', e.target.value)}
            className="w-[80px] h-9 text-sm"
          />
        </SettingRow>
      </div>

      <Separator />

      {/* ── 6. Notifications ──────────────────────────── */}
      <div className="space-y-3">
        <SectionHeader
          title="Notifications"
          description="Choose what your agent notifies you about."
        />
        <SettingRow label="Task Completed" description="Get notified when a long-running task finishes.">
          <Switch
            checked={config.notifyTaskComplete}
            onCheckedChange={(v) => update('notifyTaskComplete', v)}
          />
        </SettingRow>
        <SettingRow label="Errors & Failures" description="Alert when something goes wrong during a task.">
          <Switch
            checked={config.notifyErrors}
            onCheckedChange={(v) => update('notifyErrors', v)}
          />
        </SettingRow>
        <SettingRow label="Budget Warning" description="Heads up when you're approaching your monthly limit.">
          <Switch
            checked={config.notifyBudgetWarning}
            onCheckedChange={(v) => update('notifyBudgetWarning', v)}
          />
        </SettingRow>
      </div>

      {/* ── 7. Danger Zone ─────────────────────────────── */}
      <div className="space-y-3">
        <SectionHeader
          title="Danger Zone"
          description="Irreversible actions — proceed with caution."
        />
        <div className="rounded-xl border border-status-error/20 bg-status-error/5 p-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium">Remove this Agent</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Permanently shut down and delete all data for this agent.
            </p>
          </div>
          <RemoveAgentButton instanceId={instanceId} agentName={agentName} redirectTo="/workspace/home" />
        </div>
      </div>

      <Separator />

      {/* ── Save bar ──────────────────────────────────── */}
      <div
        className={`sticky bottom-0 -mx-6 px-6 py-3 bg-background/80 backdrop-blur-sm border-t border-border/40 flex items-center gap-3 transition-all ${
          hasChanges
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-2 pointer-events-none'
        }`}
      >
        <Button size="sm" onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="size-3 mr-1.5 animate-spin" />}
          {saved ? 'Saved' : 'Save Changes'}
        </Button>
        <button
          onClick={handleReset}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <RotateCcw className="size-3" />
          Reset
        </button>
      </div>
    </div>
  )
}
