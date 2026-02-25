import { z } from 'zod'

export const openagentsYamlSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be at most 50 characters'),
  slug: z.string()
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens only')
    .min(2)
    .max(60),
  tagline: z.string().min(10, 'Tagline must be at least 10 characters').max(120, 'Tagline must be at most 120 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters').max(2000),
  category: z.enum(['productivity', 'research', 'writing', 'coding', 'business', 'creative', 'personal']),
  icon: z.string().optional(),
  pricing: z.object({
    model: z.enum(['per_session', 'per_task', 'free']),
    credits: z.number().nullable().optional(),
  }),
  capabilities: z.array(z.string()).max(10).optional(),
  relays: z.array(z.string()).optional(),
  models: z.object({
    primary: z.string(),
    minimum: z.string().optional(),
  }).optional(),
  screenshots: z.array(z.object({
    path: z.string(),
    caption: z.string().optional(),
  })).optional(),
  tags: z.array(z.string()).max(10).optional(),
  version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Version must be semver (e.g., 1.0.0)').optional(),
})

export type OpenAgentsYaml = z.infer<typeof openagentsYamlSchema>
