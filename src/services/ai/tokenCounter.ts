export interface ModelLimits {
  maxTokens: number;
  maxOutputTokens: number;
}

const MODEL_LIMITS: Record<string, ModelLimits> = {
  'gpt-4': { maxTokens: 8192, maxOutputTokens: 4096 },
  'gpt-4-turbo': { maxTokens: 128000, maxOutputTokens: 4096 },
  'gpt-4o': { maxTokens: 128000, maxOutputTokens: 4096 },
  'gpt-3.5-turbo': { maxTokens: 16384, maxOutputTokens: 4096 },
  'claude-3-opus': { maxTokens: 200000, maxOutputTokens: 4096 },
  'claude-3-sonnet': { maxTokens: 200000, maxOutputTokens: 4096 },
  'claude-3-haiku': { maxTokens: 200000, maxOutputTokens: 4096 },
};

/**
 * Approximate token count using character-based estimation.
 * ~4 characters per token for English text, ~3.5 for code.
 */
export function estimateTokenCount(text: string): number {
  if (!text) return 0;
  // Code tends to have shorter tokens due to symbols
  const hasCodeIndicators = /[{}();=<>]/.test(text);
  const charsPerToken = hasCodeIndicators ? 3.5 : 4;
  return Math.ceil(text.length / charsPerToken);
}

export function getModelLimits(model: string): ModelLimits {
  // Try exact match first, then prefix match
  if (MODEL_LIMITS[model]) return MODEL_LIMITS[model];

  for (const [key, limits] of Object.entries(MODEL_LIMITS)) {
    if (model.startsWith(key)) return limits;
  }

  // Default limits
  return { maxTokens: 4096, maxOutputTokens: 2048 };
}

export function fitWithinTokenBudget(
  texts: string[],
  maxTokens: number
): string[] {
  const result: string[] = [];
  let currentTokens = 0;

  for (const text of texts) {
    const tokens = estimateTokenCount(text);
    if (currentTokens + tokens > maxTokens) break;
    result.push(text);
    currentTokens += tokens;
  }

  return result;
}

export function truncateToTokenLimit(text: string, maxTokens: number): string {
  const estimatedTokens = estimateTokenCount(text);
  if (estimatedTokens <= maxTokens) return text;

  // Approximate character limit
  const charLimit = Math.floor(maxTokens * 3.5);
  return text.slice(0, charLimit) + '\n... (truncated)';
}
