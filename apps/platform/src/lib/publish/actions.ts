'use server'

import { createServiceClient } from '@openagents/db/server'
import { getUser } from '@/lib/auth/get-user'
import { validateOpenagentsYaml } from './validate'

interface PublishParams {
  repoFullName: string
  branch: string
  yamlContent: string
  readmeContent: string
}

export async function publishAgent({ repoFullName, yamlContent }: PublishParams) {
  const user = await getUser()
  if (!user) throw new Error('Not authenticated')

  // Validate YAML
  const validation = validateOpenagentsYaml(yamlContent)
  if (!validation.valid || !validation.parsed) {
    return { error: `Invalid openagents.yaml: ${validation.errors.join(', ')}` }
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
    pricing_model: config.pricing.model === 'free' ? 'free' : 'credits',
    credits_per_session: config.pricing.credits ?? 0,
    github_repo_url: `https://github.com/${repoFullName}`,
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
    docker_image: 'registry.fly.io/openagents-agent-base:latest',
  })

  return { success: true, agentId, slug: config.slug }
}

export async function unpublishAgent(agentId: string) {
  const user = await getUser()
  if (!user) throw new Error('Not authenticated')

  const service = createServiceClient()
  const { error } = await service
    .from('agents')
    .update({ status: 'draft', published_at: null })
    .eq('id', agentId)
    .eq('creator_id', user.id)

  if (error) return { error: error.message }
  return { success: true }
}
