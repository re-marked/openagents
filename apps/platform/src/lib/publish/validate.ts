import YAML from 'yaml'
import { agentbayYamlSchema, type AgentBayYaml } from './schema'

export interface ValidationResult {
  valid: boolean
  errors: string[]
  parsed: AgentBayYaml | null
}

export function validateAgentBayYaml(content: string): ValidationResult {
  // Parse YAML
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

  // Validate against schema
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

const SECRET_PATTERNS = [
  /sk[-_][a-zA-Z0-9]{20,}/,        // Stripe / OpenAI keys
  /ghp_[a-zA-Z0-9]{36}/,            // GitHub personal access tokens
  /gho_[a-zA-Z0-9]{36}/,            // GitHub OAuth tokens
  /AIza[a-zA-Z0-9_-]{35}/,          // Google API keys
  /-----BEGIN.*PRIVATE KEY-----/,    // Private keys
  /password\s*[:=]\s*['"]/i,        // Password assignments
]

export function scanForSecrets(content: string): string[] {
  const findings: string[] = []
  for (const pattern of SECRET_PATTERNS) {
    if (pattern.test(content)) {
      findings.push(`Potential secret detected: ${pattern.source.slice(0, 30)}...`)
    }
  }
  return findings
}
