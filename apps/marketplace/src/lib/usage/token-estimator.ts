/**
 * Estimate token count from text using chars/4 heuristic.
 * ~80% accurate for English; upgradeable to tiktoken later.
 */
export function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4))
}

/**
 * Calculate credits consumed from token counts.
 * 1 credit = 1,000 tokens (input + output combined), minimum 0.1.
 */
export function calculateCredits(inputTokens: number, outputTokens: number): number {
  const total = inputTokens + outputTokens
  const credits = total / 1000
  return Math.max(0.1, Math.round(credits * 100) / 100)
}

/**
 * Estimate USD cost from credits (analytics only).
 * $0.01 per credit.
 */
export function estimateCostUsd(credits: number): number {
  return Math.round(credits * 0.01 * 10000) / 10000
}
