'use server'

import { createServiceClient } from '@agentbay/db/server'
import { getUser } from '@/lib/auth/get-user'
import { validateAgentBayYaml, scanForSecrets } from './validate'
import { agentUpdateSchema } from './schema'

interface PublishParams {
  repoFullName: string
  branch: string
  yamlContent: string
  readmeContent: string
}

export async function publishAgent({ repoFullName, yamlContent, readmeContent }: PublishParams) {
  const user = await getUser()
  if (!user) throw new Error('Not authenticated')

  // Server-side secret scanning
  const secrets = [
    ...scanForSecrets(yamlContent),
    ...scanForSecrets(readmeContent),
  ]
  if (secrets.length > 0) {
    return { error: `Security check failed: ${secrets.join('; ')}` }
  }

  // Validate YAML
  const validation = validateAgentBayYaml(yamlContent)
  if (!validation.valid || !validation.parsed) {
    return { error: `Invalid agentbay.yaml: ${validation.errors.join(', ')}` }
  }

  const config = validation.parsed
  const service = createServiceClient()

  // Check if agent with this slug already exists for this creator
  const { data: existing } = await service
    .from('agents')
    .select('id')
    .eq('slug', config.slug)
    .eq('creator_id', user.id)
    .single()

  const agentData = {
    name: config.name,
    slug: config.slug,
    tagline: config.tagline,
    description: config.description,
    category: config.category,
    creator_id: user.id,
    pricing_model: config.pricing.model,
    credits_per_session: config.pricing.credits ?? 0,
    github_repo_url: `https://github.com/${repoFullName}`,
    icon_url: config.icon ?? null,
    tags: config.tags ?? [],
    supported_models: config.models ? [config.models.primary, ...(config.models.minimum ? [config.models.minimum] : [])] : [],
    supported_relays: config.relays ?? [],
    status: 'published',
    published_at: new Date().toISOString(),
  }

  let agentId: string

  if (existing) {
    // Update existing
    const { error } = await service
      .from('agents')
      .update(agentData)
      .eq('id', existing.id)
    if (error) return { error: error.message }
    agentId = existing.id
  } else {
    // Create new
    const { data, error } = await service
      .from('agents')
      .insert(agentData)
      .select('id')
      .single()
    if (error) return { error: error.message }
    agentId = data.id
  }

  // Create version record
  await service.from('agent_versions').insert({
    agent_id: agentId,
    version: config.version ?? '1.0.0',
    changelog: existing ? 'Updated agent configuration' : 'Initial release',
    docker_image: 'registry.fly.io/agentbay-agent-base:latest',
  })

  return { success: true, agentId, slug: config.slug }
}

export async function unpublishAgent(slug: string) {
  const user = await getUser()
  if (!user) throw new Error('Not authenticated')

  const service = createServiceClient()
  const { error } = await service
    .from('agents')
    .update({ status: 'draft', published_at: null })
    .eq('slug', slug)
    .eq('creator_id', user.id)

  if (error) return { error: error.message }
  return { success: true }
}

export async function republishAgent(slug: string) {
  const user = await getUser()
  if (!user) throw new Error('Not authenticated')

  const service = createServiceClient()
  const { error } = await service
    .from('agents')
    .update({ status: 'published', published_at: new Date().toISOString() })
    .eq('slug', slug)
    .eq('creator_id', user.id)

  if (error) return { error: error.message }
  return { success: true }
}

export async function updateAgent(slug: string, updates: unknown) {
  const user = await getUser()
  if (!user) throw new Error('Not authenticated')

  const parsed = agentUpdateSchema.safeParse(updates)
  if (!parsed.success) {
    return {
      error: `Invalid fields: ${parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ')}`,
    }
  }

  const service = createServiceClient()

  const dbUpdates: Record<string, unknown> = {}
  if (parsed.data.tagline !== undefined) dbUpdates.tagline = parsed.data.tagline
  if (parsed.data.description !== undefined) dbUpdates.description = parsed.data.description
  if (parsed.data.category !== undefined) dbUpdates.category = parsed.data.category
  if (parsed.data.tags !== undefined) dbUpdates.tags = parsed.data.tags
  if (parsed.data.icon !== undefined) dbUpdates.icon_url = parsed.data.icon

  if (Object.keys(dbUpdates).length === 0) {
    return { error: 'No valid fields to update' }
  }

  const { data, error } = await service
    .from('agents')
    .update(dbUpdates)
    .eq('slug', slug)
    .eq('creator_id', user.id)
    .select('id, slug, name')
    .single()

  if (error || !data) return { error: 'Agent not found or update failed' }
  return { success: true, agent: data }
}

export async function createPublishToken(name: string) {
  const user = await getUser()
  if (!user) throw new Error('Not authenticated')

  // Generate 32 random hex chars
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  const token = `ab_pub_${hex}`
  const tokenPrefix = `ab_pub_${hex.slice(0, 4)}...`

  // SHA-256 hash
  const encoder = new TextEncoder()
  const data = encoder.encode(token)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const tokenHash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')

  const service = createServiceClient()
  const { data: row, error } = await service
    .from('publish_tokens')
    .insert({
      user_id: user.id,
      name: name.trim() || 'default',
      token_hash: tokenHash,
      token_prefix: tokenPrefix,
    })
    .select('id, name, token_prefix, created_at')
    .single()

  if (error) return { error: error.message }

  return {
    success: true,
    id: row.id,
    name: row.name,
    token,
    token_prefix: row.token_prefix,
    created_at: row.created_at,
  }
}

export async function revokePublishToken(tokenId: string) {
  const user = await getUser()
  if (!user) throw new Error('Not authenticated')

  const service = createServiceClient()
  const { error } = await service
    .from('publish_tokens')
    .delete()
    .eq('id', tokenId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  return { success: true }
}
