import { createServiceClient } from '@agentbay/db/server'
import { fetchRepoFile, validateRepoFiles } from './github'
import {
  validateAgentBayYaml,
  scanForSecrets,
  agentUpdateSchema,
  type AgentBayYaml,
  type AgentUpdate,
} from './schema'

// ── Types ──

interface PublishInput {
  userId: string
  repo: string
  branch?: string
  githubToken?: string
  overrides?: Partial<AgentUpdate>
}

interface AgentResult {
  id: string
  slug: string
  name: string
  status: string
  version: string
  url: string
  created_at: string
  updated_at: string
}

// ── Publish ──

export async function publishAgentFromRepo(
  input: PublishInput
): Promise<AgentResult> {
  const { userId, repo, branch, githubToken, overrides } = input

  // 1. Validate repo files exist
  const fileCheck = await validateRepoFiles(repo, branch, githubToken)
  if (!fileCheck.valid) {
    const missing = fileCheck.files
      .filter((f) => f.required && !f.found)
      .map((f) => f.path)
    throw new PublishError(
      `Missing required files: ${missing.join(', ')}`,
      422
    )
  }

  // 2. Fetch agentbay.yaml and README.md
  const ref = fileCheck.branch
  const [yamlContent, readmeContent] = await Promise.all([
    fetchRepoFile(repo, 'agentbay.yaml', ref, githubToken),
    fetchRepoFile(repo, 'README.md', ref, githubToken),
  ])

  // 3. Scan for secrets
  const secrets = [
    ...scanForSecrets(yamlContent),
    ...scanForSecrets(readmeContent),
  ]
  if (secrets.length > 0) {
    throw new PublishError(
      `Security check failed: ${secrets.join('; ')}`,
      422
    )
  }

  // 4. Validate YAML schema
  const validation = validateAgentBayYaml(yamlContent)
  if (!validation.valid || !validation.parsed) {
    throw new PublishError(
      `Invalid agentbay.yaml: ${validation.errors.join(', ')}`,
      422
    )
  }

  const config = validation.parsed

  // 5. Apply overrides
  if (overrides) {
    const overrideResult = agentUpdateSchema.safeParse(overrides)
    if (!overrideResult.success) {
      throw new PublishError(
        `Invalid overrides: ${overrideResult.error.issues.map((i) => i.message).join(', ')}`,
        422
      )
    }
    Object.assign(config, overrideResult.data)
  }

  const service = createServiceClient()

  // 6. Check if agent with this slug already exists for this creator
  const { data: existing } = await service
    .from('agents')
    .select('id, created_at')
    .eq('slug', config.slug)
    .eq('creator_id', userId)
    .single()

  const agentData = {
    name: config.name,
    slug: config.slug,
    tagline: config.tagline,
    description: config.description,
    category: config.category,
    creator_id: userId,
    pricing_model: config.pricing.model,
    credits_per_session: config.pricing.credits ?? 0,
    github_repo_url: `https://github.com/${repo}`,
    icon_url: config.icon ?? null,
    tags: config.tags ?? [],
    supported_models: config.models
      ? [
          config.models.primary,
          ...(config.models.minimum ? [config.models.minimum] : []),
        ]
      : [],
    supported_relays: config.relays ?? [],
    status: 'published' as const,
    published_at: new Date().toISOString(),
  }

  let agentId: string
  let createdAt: string

  if (existing) {
    const { error } = await service
      .from('agents')
      .update(agentData)
      .eq('id', existing.id)
    if (error) throw new PublishError(error.message, 500)
    agentId = existing.id
    createdAt = existing.created_at
  } else {
    const { data, error } = await service
      .from('agents')
      .insert(agentData)
      .select('id, created_at')
      .single()
    if (error) throw new PublishError(error.message, 500)
    agentId = data.id
    createdAt = data.created_at
  }

  // 7. Create version record
  const version = config.version ?? '1.0.0'
  await service.from('agent_versions').insert({
    agent_id: agentId,
    version,
    changelog: existing
      ? 'Updated agent configuration'
      : 'Initial release',
    docker_image: 'registry.fly.io/agentbay-agent-base:latest',
  })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://agentbay.cc'

  return {
    id: agentId,
    slug: config.slug,
    name: config.name,
    status: 'published',
    version,
    url: `${appUrl}/agents/${config.slug}`,
    created_at: createdAt,
    updated_at: new Date().toISOString(),
  }
}

// ── Preview ──

export async function previewAgentFromRepo(input: {
  repo: string
  branch?: string
  githubToken?: string
}) {
  const { repo, branch, githubToken } = input

  const fileCheck = await validateRepoFiles(repo, branch, githubToken)
  const ref = fileCheck.branch

  let metadata: AgentBayYaml | null = null
  let errors: string[] = []

  if (fileCheck.files.find((f) => f.path === 'agentbay.yaml')?.found) {
    const yamlContent = await fetchRepoFile(
      repo,
      'agentbay.yaml',
      ref,
      githubToken
    )
    const validation = validateAgentBayYaml(yamlContent)
    metadata = validation.parsed
    errors = validation.errors
  } else {
    errors.push('agentbay.yaml not found')
  }

  return { files: fileCheck.files, metadata, errors, branch: ref }
}

// ── List ──

export async function listCreatorAgents(userId: string) {
  const service = createServiceClient()
  const { data, error } = await service
    .from('agents')
    .select(
      'id, slug, name, tagline, category, status, published_at, created_at, updated_at, total_hires, avg_rating, tags'
    )
    .eq('creator_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw new PublishError(error.message, 500)
  return data ?? []
}

// ── Get ──

export async function getCreatorAgent(userId: string, slug: string) {
  const service = createServiceClient()
  const { data, error } = await service
    .from('agents')
    .select('*')
    .eq('slug', slug)
    .eq('creator_id', userId)
    .single()

  if (error || !data) throw new PublishError('Agent not found', 404)
  return data
}

// ── Update ──

export async function updateAgent(
  userId: string,
  slug: string,
  updates: unknown
) {
  const parsed = agentUpdateSchema.safeParse(updates)
  if (!parsed.success) {
    throw new PublishError(
      `Invalid fields: ${parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ')}`,
      422
    )
  }

  const service = createServiceClient()

  // Build the DB update payload — only include defined fields
  const dbUpdates: Record<string, unknown> = {}
  if (parsed.data.tagline !== undefined) dbUpdates.tagline = parsed.data.tagline
  if (parsed.data.description !== undefined)
    dbUpdates.description = parsed.data.description
  if (parsed.data.category !== undefined)
    dbUpdates.category = parsed.data.category
  if (parsed.data.tags !== undefined) dbUpdates.tags = parsed.data.tags
  if (parsed.data.icon !== undefined) dbUpdates.icon_url = parsed.data.icon

  if (Object.keys(dbUpdates).length === 0) {
    throw new PublishError('No valid fields to update', 422)
  }

  const { data, error } = await service
    .from('agents')
    .update(dbUpdates)
    .eq('slug', slug)
    .eq('creator_id', userId)
    .select('*')
    .single()

  if (error || !data) throw new PublishError('Agent not found or update failed', 404)
  return data
}

// ── Unpublish ──

export async function unpublishAgent(userId: string, slug: string) {
  const service = createServiceClient()
  const { data, error } = await service
    .from('agents')
    .update({ status: 'draft', published_at: null })
    .eq('slug', slug)
    .eq('creator_id', userId)
    .select('id, slug, status')
    .single()

  if (error || !data) throw new PublishError('Agent not found', 404)
  return data
}

// ── Error class ──

export class PublishError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'PublishError'
    this.status = status
  }
}
