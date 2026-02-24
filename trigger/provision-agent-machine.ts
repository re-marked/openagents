import { task, logger } from '@trigger.dev/sdk/v3'
import { createServiceClient } from '@openagents/db'
import { FlyClient } from '@openagents/fly'
import { AGENT_ROLES } from './agent-roles'

const BASE_IMAGE = process.env.FLY_AGENT_BASE_IMAGE ?? 'registry.fly.io/openagents-agent-base:latest'
const FLY_ORG = process.env.FLY_ORG_SLUG ?? 'personal'
const FLY_REGION = process.env.FLY_REGION ?? 'iad'

export interface ProvisionPayload {
  userId: string
  agentId: string
  instanceId: string
  role?: string
}

export const provisionAgentMachine = task({
  id: 'provision-agent-machine',
  maxDuration: 300,
  retry: {
    maxAttempts: 3,
    factor: 2,
    minTimeoutInMs: 5_000,
  },

  run: async (payload: ProvisionPayload) => {
    const { userId, agentId, instanceId, role: roleId } = payload
    const db = createServiceClient()
    const fly = new FlyClient()

    // ── 1. Load agent definition ─────────────────────────────────────────
    const { data: agent, error: agentErr } = await db
      .from('agents')
      .select('slug, docker_image, fly_machine_size, fly_machine_memory_mb')
      .eq('id', agentId)
      .single()

    if (agentErr || !agent) throw new Error(`Agent not found: ${agentId}`)

    // ── 1b. Load role definition if this is a sub-agent ──────────────────
    const role = roleId ? AGENT_ROLES[roleId] : undefined
    if (roleId && !role) throw new Error(`Unknown role: ${roleId}`)

    // ── 2. Load user's API keys (BYOK) ──────────────────────────────────
    const { data: apiKeys } = await db
      .from('user_api_keys')
      .select('provider, api_key')
      .eq('user_id', userId)

    const keyEnv: Record<string, string> = {}
    for (const row of apiKeys ?? []) {
      if (row.provider === 'anthropic') keyEnv.ANTHROPIC_API_KEY = row.api_key
      if (row.provider === 'openai') keyEnv.OPENAI_API_KEY = row.api_key
      if (row.provider === 'google') keyEnv.GOOGLE_API_KEY = row.api_key
    }

    if (Object.keys(keyEnv).length === 0) {
      throw new Error('No API keys configured. Add at least one key in Settings.')
    }

    const image = agent.docker_image ?? BASE_IMAGE
    // Sub-agents get named by role, master agents by slug
    const appName = role
      ? `oa-${role.id}-${userId.slice(0, 8)}`
      : `oa-${agent.slug}-${userId.slice(0, 8)}`
    const gatewayToken = crypto.randomUUID()

    logger.info('Provisioning agent machine', { appName, userId, agentId })

    // ── 3. Upsert Fly app ────────────────────────────────────────────────
    const app = await fly.upsertApp(appName, FLY_ORG)
    logger.info('Fly app ready', { appName: app.name })

    // ── 4. Create volume ─────────────────────────────────────────────────
    const volume = await fly.createVolume(appName, {
      name: 'agent_data',
      region: FLY_REGION,
      size_gb: 1,
      encrypted: true,
    })
    logger.info('Volume created', { volumeId: volume.id })

    // ── 5. Create machine ─────────────────────────────────────────────────
    // Inject role-specific env vars for sub-agents
    const roleEnv: Record<string, string> = {}
    if (role) {
      roleEnv.AGENT_SOUL_MD = role.soul
      roleEnv.AGENT_YAML = role.agentYaml
      roleEnv.AGENT_OPENCLAW_OVERRIDES = JSON.stringify(role.openclawOverrides)
    }

    const machine = await fly.createMachine(appName, {
      region: FLY_REGION,
      config: {
        image,
        env: {
          OPENCLAW_STATE_DIR: '/data',
          OPENCLAW_GATEWAY_TOKEN: gatewayToken,
          NODE_OPTIONS: '--max-old-space-size=1536',
          NODE_ENV: 'production',
          ...keyEnv,
          ...roleEnv,
        },
        mounts: [{ volume: volume.id, path: '/data' }],
        services: [
          {
            protocol: 'tcp',
            internal_port: 18789,
            autostop: 'suspend',
            autostart: true,
            min_machines_running: 0,
            checks: [
              {
                type: 'http',
                port: 18789,
                path: '/health',
                method: 'GET',
                interval: '30s',
                timeout: '5s',
                grace_period: '30s',
              },
            ],
          },
        ],
        guest: {
          cpu_kind: 'shared',
          cpus: 2,
          memory_mb: agent.fly_machine_memory_mb ?? 2048,
        },
        restart: { policy: 'on-failure' },
      },
    })

    logger.info('Machine created', { machineId: machine.id })

    // ── 6. Wait for machine to start ─────────────────────────────────────
    await fly.waitForMachineState(appName, machine.id, 'started', 60)
    logger.info('Machine started', { machineId: machine.id })

    // ── 7. Store machine info + gateway token in DB ──────────────────────
    await db
      .from('agent_instances')
      .update({
        fly_app_name: appName,
        fly_machine_id: machine.id,
        fly_volume_id: volume.id,
        gateway_token: gatewayToken,
        region: FLY_REGION,
        status: 'running',
      })
      .eq('id', instanceId)

    logger.info('Instance record updated', { instanceId })

    return {
      machineId: machine.id,
      appName,
      volumeId: volume.id,
      region: FLY_REGION,
    }
  },
})
