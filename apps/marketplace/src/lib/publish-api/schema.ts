import { z } from 'zod'
import YAML from 'yaml'

// ── Zod schema for agent.yaml (runtime config) ──

export const agentYamlSchema = z.object({
  // Identity
  name: z.string().min(1).max(50),
  soul: z.string().optional().default('SOUL.md'),
  brain: z.string().optional().default('BRAIN.md'),
  bootstrap: z.string().optional().default('BOOTSTRAP.md'),
  identity: z.string().optional(),

  // Knowledge & Memory
  memory: z
    .object({
      dir: z.string().optional().default('memory/'),
      mode: z.enum(['persistent', 'ephemeral', 'off']).optional().default('persistent'),
      compaction: z.enum(['safeguard', 'aggressive', 'off']).optional().default('safeguard'),
    })
    .optional()
    .default({ dir: 'memory/', mode: 'persistent' as const, compaction: 'safeguard' as const }),

  // Skills
  skills: z
    .object({
      dir: z.string().optional().default('skills/'),
      bundled: z.array(z.string()).optional().default([]),
      install: z
        .object({
          nodeManager: z.enum(['pnpm', 'npm', 'yarn']).optional().default('pnpm'),
        })
        .optional()
        .default({ nodeManager: 'pnpm' as const }),
    })
    .optional()
    .default({ dir: 'skills/', bundled: [], install: { nodeManager: 'pnpm' as const } }),

  // Model
  model: z.object({
    primary: z.string(),
    fallback: z.string().optional(),
    aliases: z.record(z.string(), z.string()).optional(),
  }),

  // Tools
  tools: z
    .object({
      profile: z.enum(['coding', 'general', 'research', 'creative']).optional().default('coding'),
      allow: z.array(z.string()).optional().default([
        'exec', 'web_search', 'read', 'write', 'edit', 'apply_patch',
      ]),
      deny: z.array(z.string()).optional().default(['browser', 'gateway', 'cron']),
      elevated: z.boolean().optional().default(true),
    })
    .optional()
    .default({
      profile: 'coding' as const,
      allow: ['exec', 'web_search', 'read', 'write', 'edit', 'apply_patch'],
      deny: ['browser', 'gateway', 'cron'],
      elevated: true,
    }),

  // Sandbox
  sandbox: z.enum(['off', 'docker', 'firecracker']).optional().default('off'),

  // Runtime
  runtime: z
    .object({
      maxConcurrent: z.number().int().min(1).max(16).optional().default(4),
      subagents: z
        .object({
          maxConcurrent: z.number().int().min(1).max(32).optional().default(8),
        })
        .optional()
        .default({ maxConcurrent: 8 }),
      verbose: z.enum(['full', 'minimal', 'off']).optional().default('full'),
      blockStreaming: z.boolean().optional().default(true),
    })
    .optional()
    .default({
      maxConcurrent: 4,
      subagents: { maxConcurrent: 8 },
      verbose: 'full' as const,
      blockStreaming: true,
    }),

  // Auth providers (declares requirements — platform injects keys at boot)
  providers: z
    .array(z.enum(['google', 'anthropic', 'openai']))
    .optional()
    .default(['google']),

  // Gateway
  gateway: z
    .object({
      port: z.number().int().optional().default(18789),
      bind: z.enum(['lan', 'loopback', 'auto']).optional().default('lan'),
      auth: z.enum(['token', 'none']).optional().default('token'),
      http: z
        .object({
          chatCompletions: z.boolean().optional().default(true),
          responses: z.boolean().optional().default(true),
        })
        .optional()
        .default({ chatCompletions: true, responses: true }),
      trustedProxies: z
        .array(z.string())
        .optional()
        .default(['172.16.0.0/12', 'fdaa::/16']),
    })
    .optional()
    .default({
      port: 18789,
      bind: 'lan' as const,
      auth: 'token' as const,
      http: { chatCompletions: true, responses: true },
      trustedProxies: ['172.16.0.0/12', 'fdaa::/16'],
    }),

  // Hooks
  hooks: z
    .object({
      bootMd: z.boolean().optional().default(true),
      commandLogger: z.boolean().optional().default(true),
      sessionMemory: z.boolean().optional().default(true),
    })
    .optional()
    .default({ bootMd: true, commandLogger: true, sessionMemory: true }),
})

export type AgentYaml = z.infer<typeof agentYamlSchema>

// ── Zod schema for agentbay.yaml (marketplace listing) ──

export const agentbayYamlSchema = z.object({
  // Required
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

  // Pricing
  pricing: z.object({
    model: z.enum(['per_session', 'per_task', 'free']),
    credits: z.number().nullable().optional(),
  }),

  // Identity
  version: z
    .string()
    .regex(/^\d+\.\d+\.\d+$/, 'Version must be semver (e.g., 1.0.0)')
    .optional(),
  icon: z.string().optional(),
  author: z
    .object({
      name: z.string().max(100),
      url: z.string().url().optional(),
    })
    .optional(),

  // Marketplace display
  capabilities: z.array(z.string()).max(10).optional(),
  tags: z.array(z.string()).max(10).optional(),
  screenshots: z
    .array(
      z.object({
        path: z.string(),
        caption: z.string().optional(),
      })
    )
    .optional(),

  // Runtime requirements
  models: z
    .object({
      primary: z.string(),
      minimum: z.string().optional(),
    })
    .optional(),
  relays: z
    .array(z.enum(['telegram', 'discord', 'whatsapp', 'slack']))
    .optional(),

  // Infrastructure (optional — platform has sensible defaults)
  infra: z
    .object({
      machine: z.string().optional().default('shared-cpu-2x'),
      memoryMb: z.number().int().min(2048).optional().default(2048),
      volumeGb: z.number().int().min(1).max(10).optional().default(1),
      region: z.string().optional().default('iad'),
      docker: z
        .object({
          image: z.string(),
          tag: z.string().optional().default('latest'),
        })
        .optional(),
    })
    .optional(),
})

export type AgentBayYaml = z.infer<typeof agentbayYamlSchema>

// ── YAML validation ──

export interface ValidationResult<T = AgentBayYaml> {
  valid: boolean
  errors: string[]
  parsed: T | null
}

function validateYaml<T>(content: string, schema: z.ZodType<T>): ValidationResult<T> {
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

  const result = schema.safeParse(raw)

  if (!result.success) {
    const errors = result.error.issues.map((issue) => {
      const path = issue.path.join('.')
      return path ? `${path}: ${issue.message}` : issue.message
    })
    return { valid: false, errors, parsed: null }
  }

  return { valid: true, errors: [], parsed: result.data }
}

export function validateAgentBayYaml(content: string): ValidationResult<AgentBayYaml> {
  return validateYaml(content, agentbayYamlSchema)
}

export function validateAgentYaml(content: string): ValidationResult<AgentYaml> {
  return validateYaml(content, agentYamlSchema)
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
