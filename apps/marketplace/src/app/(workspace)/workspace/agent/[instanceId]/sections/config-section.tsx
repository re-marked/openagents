'use client'

import { useState, useRef, useCallback } from 'react'
import { Loader2, RotateCcw, Plus, Radio } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
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
  // Sandbox
  sandboxMode: string
  // Output
  outputFormat: string
  streamResponses: boolean
  // Gateway
  httpEndpoints: boolean
  port: string
  bindAddress: string
  // Debug
  debugMode: boolean
  verboseLogging: boolean
}

const DEFAULT_CONFIG: AgentConfig = {
  primaryModel: 'google/gemini-2.5-flash',
  sandboxMode: 'off',
  outputFormat: 'markdown',
  streamResponses: true,
  httpEndpoints: true,
  port: '18789',
  bindAddress: 'lan',
  debugMode: false,
  verboseLogging: false,
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
    <div className="flex items-center justify-between gap-8 py-2">
      <div className="min-w-0">
        <Label className="text-sm font-medium">{label}</Label>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      <div className="shrink-0">{children}</div>
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
}

export function ConfigSection({ instanceId: _instanceId }: ConfigSectionProps) {
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

  return (
    <div className="space-y-8">
      {/* ── 1. Model ──────────────────────────────────── */}
      <div className="space-y-3">
        <SectionHeader
          title="Model"
          description="Choose the LLM your agent uses for reasoning and responses."
        />
        <SettingRow label="Primary Model">
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
          <p className="text-[11px] font-mono text-muted-foreground/50 pl-0.5">
            {selectedModel.id}
          </p>
        )}
      </div>

      <Separator />

      {/* ── 2. Sandbox ────────────────────────────────── */}
      <div className="space-y-3">
        <SectionHeader
          title="Sandbox"
          description="Isolate agent code execution in a sandbox environment."
        />
        <SettingRow label="Sandbox Mode" description="Execution isolation strategy for agent tools.">
          <Select value={config.sandboxMode} onValueChange={(v) => update('sandboxMode', v)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="off">Off</SelectItem>
              <SelectItem value="docker">Docker</SelectItem>
              <SelectItem value="firecracker">Firecracker</SelectItem>
            </SelectContent>
          </Select>
        </SettingRow>
      </div>

      <Separator />

      {/* ── 3. Output ─────────────────────────────────── */}
      <div className="space-y-3">
        <SectionHeader
          title="Output"
          description="Control how the agent formats and delivers responses."
        />
        <SettingRow label="Output Format" description="Response rendering format.">
          <Select value={config.outputFormat} onValueChange={(v) => update('outputFormat', v)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="markdown">Markdown</SelectItem>
              <SelectItem value="plain">Plain Text</SelectItem>
              <SelectItem value="json">JSON</SelectItem>
            </SelectContent>
          </Select>
        </SettingRow>
        <SettingRow label="Stream Responses" description="Send tokens incrementally as they are generated.">
          <Switch
            checked={config.streamResponses}
            onCheckedChange={(v) => update('streamResponses', v)}
          />
        </SettingRow>
      </div>

      <Separator />

      {/* ── 4. Gateway ────────────────────────────────── */}
      <div className="space-y-3">
        <SectionHeader
          title="Gateway"
          description="Configure the gateway server network settings."
        />
        <SettingRow label="HTTP Endpoints" description="Enable the chat completions HTTP endpoint.">
          <Switch
            checked={config.httpEndpoints}
            onCheckedChange={(v) => update('httpEndpoints', v)}
          />
        </SettingRow>
        <SettingRow label="Port" description="Gateway listening port.">
          <Input
            type="number"
            value={config.port}
            onChange={(e) => update('port', e.target.value)}
            className="w-[100px] h-9 text-sm"
          />
        </SettingRow>
        <SettingRow label="Bind Address" description="Network interface to bind to.">
          <Select value={config.bindAddress} onValueChange={(v) => update('bindAddress', v)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="lan">LAN (0.0.0.0)</SelectItem>
              <SelectItem value="loopback">Loopback (127.0.0.1)</SelectItem>
              <SelectItem value="auto">Auto</SelectItem>
            </SelectContent>
          </Select>
        </SettingRow>
      </div>

      <Separator />

      {/* ── 5. Debug ──────────────────────────────────── */}
      <div className="space-y-3">
        <SectionHeader
          title="Debug"
          description="Enable diagnostic logging for troubleshooting."
        />
        <SettingRow label="Debug Mode" description="Attach detailed debug info to responses.">
          <Switch
            checked={config.debugMode}
            onCheckedChange={(v) => update('debugMode', v)}
          />
        </SettingRow>
        <SettingRow label="Verbose Logging" description="Log all internal operations to stdout.">
          <Switch
            checked={config.verboseLogging}
            onCheckedChange={(v) => update('verboseLogging', v)}
          />
        </SettingRow>
      </div>

      <Separator />

      {/* ── 6. Relays ─────────────────────────────────── */}
      <div className="space-y-3">
        <SectionHeader
          title="Relays"
          description="Connect your agent to external relay services."
        />
        <div className="rounded-lg border border-dashed border-border/60 px-4 py-6 flex flex-col items-center gap-2 text-center">
          <Radio className="size-5 text-muted-foreground/40" />
          <p className="text-xs text-muted-foreground/60">No relay connections configured</p>
          <Button variant="ghost" size="sm" disabled className="mt-1 gap-1.5 text-xs">
            <Plus className="size-3" />
            Add Relay
          </Button>
        </div>
      </div>

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
