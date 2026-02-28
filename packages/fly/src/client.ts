import type {
  CreateMachineOptions,
  CreateVolumeOptions,
  FlyApp,
  FlyMachine,
  FlyVolume,
} from './types'

const FLY_API_BASE = 'https://api.machines.dev/v1'
const FLY_GRAPHQL_URL = 'https://api.fly.io/graphql'

export class FlyClient {
  private headers: Record<string, string>
  private graphqlHeaders: Record<string, string>

  constructor(apiToken?: string) {
    const token = apiToken ?? process.env.FLY_API_TOKEN
    if (!token) throw new Error('FLY_API_TOKEN is required')
    // FLY_GRAPHQL_TOKEN is an org-level token that works with the GraphQL API.
    // FLY_API_TOKEN (deploy token) only works with the Machines REST API.
    const graphqlToken = process.env.FLY_GRAPHQL_TOKEN ?? token
    this.headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
    this.graphqlHeaders = {
      Authorization: `Bearer ${graphqlToken}`,
      'Content-Type': 'application/json',
    }
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    const res = await fetch(`${FLY_API_BASE}${path}`, {
      method,
      headers: this.headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText)
      throw new Error(`Fly API ${method} ${path} → ${res.status}: ${text}`)
    }
    // 204 No Content
    if (res.status === 204) return undefined as T
    return res.json() as Promise<T>
  }

  private async graphql<T>(query: string, variables: Record<string, unknown>): Promise<T> {
    const res = await fetch(FLY_GRAPHQL_URL, {
      method: 'POST',
      headers: this.graphqlHeaders,
      body: JSON.stringify({ query, variables }),
    })
    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText)
      throw new Error(`Fly GraphQL → ${res.status}: ${text}`)
    }
    const json = await res.json() as { data?: T; errors?: { message: string }[] }
    if (json.errors?.length) {
      throw new Error(`Fly GraphQL error: ${json.errors.map(e => e.message).join(', ')}`)
    }
    return json.data as T
  }

  // ── Apps ──────────────────────────────────────────────────────────────────

  async createApp(name: string, org: string, network?: string): Promise<FlyApp> {
    return this.request<FlyApp>('POST', '/apps', { app_name: name, org_slug: org, network })
  }

  async getApp(appName: string): Promise<FlyApp> {
    return this.request<FlyApp>('GET', `/apps/${appName}`)
  }

  async deleteApp(appName: string): Promise<void> {
    return this.request<void>('DELETE', `/apps/${appName}`)
  }

  /** Upsert — create only if the app doesn't exist yet */
  async upsertApp(name: string, org: string, network?: string): Promise<FlyApp> {
    try {
      return await this.getApp(name)
    } catch {
      return this.createApp(name, org, network)
    }
  }

  // ── IPs ─────────────────────────────────────────────────────────────────

  /** Allocate a shared IPv4 address for an app (needed for public .fly.dev access). */
  async allocateSharedIpv4(appName: string): Promise<void> {
    try {
      await this.graphql(
        `mutation($appId: ID!, $type: IPAddressType!) {
          allocateIpAddress(input: { appId: $appId, type: $type }) {
            ipAddress { id address type }
          }
        }`,
        { appId: appName, type: 'shared_v4' }
      )
    } catch {
      // May already exist — ignore
    }
  }

  /** Allocate a dedicated IPv6 address for an app. */
  async allocateIpv6(appName: string): Promise<void> {
    try {
      await this.graphql(
        `mutation($appId: ID!, $type: IPAddressType!) {
          allocateIpAddress(input: { appId: $appId, type: $type }) {
            ipAddress { id address type }
          }
        }`,
        { appId: appName, type: 'v6' }
      )
    } catch {
      // May already exist — ignore
    }
  }

  // ── Machines ──────────────────────────────────────────────────────────────

  async createMachine(appName: string, opts: CreateMachineOptions): Promise<FlyMachine> {
    return this.request<FlyMachine>('POST', `/apps/${appName}/machines`, opts)
  }

  async getMachine(appName: string, machineId: string): Promise<FlyMachine> {
    return this.request<FlyMachine>('GET', `/apps/${appName}/machines/${machineId}`)
  }

  async listMachines(appName: string): Promise<FlyMachine[]> {
    return this.request<FlyMachine[]>('GET', `/apps/${appName}/machines`)
  }

  async startMachine(appName: string, machineId: string): Promise<void> {
    return this.request<void>('POST', `/apps/${appName}/machines/${machineId}/start`)
  }

  async stopMachine(appName: string, machineId: string, signal = 'SIGTERM'): Promise<void> {
    return this.request<void>('POST', `/apps/${appName}/machines/${machineId}/stop`, { signal })
  }

  async suspendMachine(appName: string, machineId: string): Promise<void> {
    return this.request<void>('POST', `/apps/${appName}/machines/${machineId}/suspend`)
  }

  async deleteMachine(appName: string, machineId: string, force = false): Promise<void> {
    return this.request<void>(
      'DELETE',
      `/apps/${appName}/machines/${machineId}${force ? '?force=true' : ''}`
    )
  }

  async updateMachine(
    appName: string,
    machineId: string,
    opts: Partial<CreateMachineOptions>
  ): Promise<FlyMachine> {
    return this.request<FlyMachine>('POST', `/apps/${appName}/machines/${machineId}`, opts)
  }

  /**
   * Poll machine state until it matches `targetState` or we hit the timeout.
   */
  async waitForMachineState(
    appName: string,
    machineId: string,
    targetState: FlyMachine['state'],
    timeoutSeconds = 60
  ): Promise<FlyMachine> {
    const deadline = Date.now() + timeoutSeconds * 1000
    while (Date.now() < deadline) {
      const machine = await this.getMachine(appName, machineId)
      if (machine.state === targetState) return machine
      if (machine.state === 'destroyed' || machine.state === 'destroying') {
        throw new Error(`Machine ${machineId} was destroyed while waiting for ${targetState}`)
      }
      await new Promise((r) => setTimeout(r, 2000))
    }
    throw new Error(`Timed out waiting for machine ${machineId} to reach state ${targetState}`)
  }

  // ── Volumes ───────────────────────────────────────────────────────────────

  async createVolume(appName: string, opts: CreateVolumeOptions): Promise<FlyVolume> {
    return this.request<FlyVolume>('POST', `/apps/${appName}/volumes`, opts)
  }

  async getVolume(appName: string, volumeId: string): Promise<FlyVolume> {
    return this.request<FlyVolume>('GET', `/apps/${appName}/volumes/${volumeId}`)
  }

  async deleteVolume(appName: string, volumeId: string): Promise<void> {
    return this.request<void>('DELETE', `/apps/${appName}/volumes/${volumeId}`)
  }

  async listVolumes(appName: string): Promise<FlyVolume[]> {
    return this.request<FlyVolume[]>('GET', `/apps/${appName}/volumes`)
  }

  // ── Exec ─────────────────────────────────────────────────────────────────

  /**
   * Execute a command on a running machine via the Fly Machines exec API.
   * The machine must be in `started` state.
   */
  async execCommand(
    appName: string,
    machineId: string,
    cmd: string[]
  ): Promise<{ stdout: string; stderr: string; exit_code: number }> {
    // Fly Machines exec API expects `cmd` as a single string, not an array
    const cmdStr = cmd.join(' ')
    const res = await fetch(
      `${FLY_API_BASE}/apps/${appName}/machines/${machineId}/exec`,
      {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({ cmd: cmdStr }),
      }
    )
    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText)
      throw new Error(`Fly exec ${cmdStr} → ${res.status}: ${text}`)
    }
    const data = (await res.json()) as {
      stdout?: string
      stderr?: string
      exit_code?: number
    }
    // Fly exec returns plain text stdout/stderr — just normalize
    const normalize = (s?: string) => (s ?? '')
    return {
      stdout: normalize(data.stdout),
      stderr: normalize(data.stderr),
      exit_code: data.exit_code ?? 0,
    }
  }

  /** Read a file from a running machine. */
  async readFile(appName: string, machineId: string, path: string): Promise<string> {
    const result = await this.execCommand(appName, machineId, ['cat', path])
    if (result.exit_code !== 0) {
      throw new Error(`Failed to read ${path}: ${result.stderr}`)
    }
    return result.stdout
  }

  /** Write a file on a running machine (creates parent dirs if needed). */
  async writeFile(appName: string, machineId: string, path: string, content: string): Promise<void> {
    // Extract parent directory and ensure it exists
    const parentDir = path.replace(/\/[^/]+$/, '')
    if (parentDir && parentDir !== path) {
      await this.execCommand(appName, machineId, ['mkdir', '-p', parentDir])
    }
    // Use printf to write content to avoid heredoc shell escaping issues
    const escaped = content.replace(/\\/g, '\\\\').replace(/'/g, "'\\''")
    const result = await this.execCommand(appName, machineId, [
      'sh', '-c', `printf '%s' '${escaped}' > ${path}`,
    ])
    if (result.exit_code !== 0) {
      throw new Error(`Failed to write ${path}: ${result.stderr}`)
    }
  }

  /** Delete a file or directory on a running machine. */
  async deletePath(appName: string, machineId: string, path: string): Promise<void> {
    const result = await this.execCommand(appName, machineId, ['rm', '-rf', path])
    if (result.exit_code !== 0) {
      throw new Error(`Failed to delete ${path}: ${result.stderr}`)
    }
  }

  /** List directory contents on a running machine. */
  async listDir(appName: string, machineId: string, path: string): Promise<string> {
    const result = await this.execCommand(appName, machineId, ['ls', '-la', path])
    if (result.exit_code !== 0) {
      throw new Error(`Failed to list ${path}: ${result.stderr}`)
    }
    return result.stdout
  }
}
