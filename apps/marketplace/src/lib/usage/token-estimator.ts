/**
 * Token estimation and API cost calculation.
 *
 * We estimate how much the user's API key was charged by looking at
 * the token count and the published per-1M-token pricing for each model.
 */

/** Estimate token count from text using chars/4 heuristic (~80% accurate for English). */
export function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4))
}

/** Per-1M-token pricing (USD) for common models. */
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  // Anthropic
  'claude-sonnet-4-20250514': { input: 3, output: 15 },
  'claude-opus-4-20250514': { input: 15, output: 75 },
  'claude-haiku-3-20250414': { input: 0.25, output: 1.25 },
  // Google
  'gemini-2.0-flash': { input: 0.1, output: 0.4 },
  'gemini-2.0-pro': { input: 1.25, output: 5 },
  'gemini-2.5-pro': { input: 1.25, output: 10 },
  'gemini-2.5-flash': { input: 0.15, output: 0.6 },
  // OpenAI
  'gpt-4o': { input: 2.5, output: 10 },
  'gpt-4o-mini': { input: 0.15, output: 0.6 },
  'o3': { input: 10, output: 40 },
  'o3-mini': { input: 1.1, output: 4.4 },
  'o4-mini': { input: 1.1, output: 4.4 },
}

/** Fallback pricing when model is unknown — uses mid-range estimate. */
const DEFAULT_PRICING = { input: 3, output: 15 }

/**
 * Estimate the API cost in USD for a given token count and model.
 * Returns a dollar amount (e.g. 0.0042).
 */
export function estimateApiCost(
  inputTokens: number,
  outputTokens: number,
  model?: string,
): number {
  const pricing = (model && MODEL_PRICING[model]) || DEFAULT_PRICING
  const cost =
    (inputTokens / 1_000_000) * pricing.input +
    (outputTokens / 1_000_000) * pricing.output
  return Math.round(cost * 10000) / 10000
}
