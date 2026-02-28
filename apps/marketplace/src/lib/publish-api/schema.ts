import { z } from 'zod'
import YAML from 'yaml'

// ── Zod schema for agentbay.yaml ──

export const agentbayYamlSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be at most 50 characters'),
  slug: z
    .string()
    .regex(
      /^[a-z0-9-]+$/,
      'Slug must be lowercase letters, numbers, and hyphens only'
    )
    .min(2)
    .max(60),
  tagline: z
    .string()
    .min(10, 'Tagline must be at least 10 characters')
    .max(120, 'Tagline must be at most 120 characters'),
  description: z
    .string()
    .min(20, 'Description must be at least 20 characters')
    .max(2000),
  category: z.enum([
    'productivity',
    'research',
    'writing',
    'coding',
    'business',
    'creative',
    'personal',
  ]),
  icon: z.string().optional(),
  pricing: z.object({
    model: z.enum(['per_session', 'per_task', 'free']),
    credits: z.number().nullable().optional(),
  }),
  capabilities: z.array(z.string()).max(10).optional(),
  relays: z.array(z.string()).optional(),
  models: z
    .object({
      primary: z.string(),
      minimum: z.string().optional(),
    })
    .optional(),
  screenshots: z
    .array(
      z.object({
        path: z.string(),
        caption: z.string().optional(),
      })
    )
    .optional(),
  tags: z.array(z.string()).max(10).optional(),
  version: z
    .string()
    .regex(/^\d+\.\d+\.\d+$/, 'Version must be semver (e.g., 1.0.0)')
    .optional(),
})

export type AgentBayYaml = z.infer<typeof agentbayYamlSchema>

// ── YAML validation ──

export interface ValidationResult {
  valid: boolean
  errors: string[]
  parsed: AgentBayYaml | null
}

export function validateAgentBayYaml(content: string): ValidationResult {
  let raw: unknown
  try {
    raw = YAML.parse(content)
  } catch (e) {
    return {
      valid: false,
      errors: [`YAML parse error: ${(e as Error).message}`],
      parsed: null,
    }
  }

  const result = agentbayYamlSchema.safeParse(raw)

  if (!result.success) {
    const errors = result.error.issues.map((issue) => {
      const path = issue.path.join('.')
      return path ? `${path}: ${issue.message}` : issue.message
    })
    return { valid: false, errors, parsed: null }
  }

  return { valid: true, errors: [], parsed: result.data }
}

// ── Secret scanning ──

const SECRET_PATTERNS = [
  /sk[-_][a-zA-Z0-9]{20,}/, // Stripe / OpenAI keys
  /ghp_[a-zA-Z0-9]{36}/, // GitHub personal access tokens
  /gho_[a-zA-Z0-9]{36}/, // GitHub OAuth tokens
  /AIza[a-zA-Z0-9_-]{35}/, // Google API keys
  /-----BEGIN.*PRIVATE KEY-----/, // Private keys
  /password\s*[:=]\s*['"]/i, // Password assignments
]

export function scanForSecrets(content: string): string[] {
  const findings: string[] = []
  for (const pattern of SECRET_PATTERNS) {
    if (pattern.test(content)) {
      findings.push(
        `Potential secret detected: ${pattern.source.slice(0, 30)}...`
      )
    }
  }
  return findings
}

// ── Override schema for PATCH updates ──

export const agentUpdateSchema = z.object({
  tagline: z.string().min(10).max(120).optional(),
  description: z.string().min(20).max(2000).optional(),
  category: z
    .enum([
      'productivity',
      'research',
      'writing',
      'coding',
      'business',
      'creative',
      'personal',
    ])
    .optional(),
  tags: z.array(z.string()).max(10).optional(),
  icon: z.string().optional(),
})

export type AgentUpdate = z.infer<typeof agentUpdateSchema>
