/**
 * AI Configuration
 *
 * Configures optional AI provider for category suggestions.
 * If OPENAI_API_KEY is not provided, the system uses fallback suggestions.
 * Backend will not fail to start if AI config is missing.
 */

export const AIConfig = {
  /**
   * Whether AI provider is enabled (has valid API key)
   */
  enabled: !!process.env.OPENAI_API_KEY,

  /**
   * OpenAI API key (optional)
   * If not provided, fallback suggestions are used
   */
  apiKey: process.env.OPENAI_API_KEY || '',

  /**
   * OpenAI model to use for category suggestions
   * Currently supported: gpt-4-mini, gpt-3.5-turbo
   * Default: gpt-4-mini (fast, cost-effective)
   */
  model: process.env.OPENAI_MODEL || 'gpt-4-mini',

  /**
   * Timeout in milliseconds for OpenAI API calls
   * If exceeded, falls back to deterministic suggestions
   * Default: 3000ms
   */
  timeoutMs: parseInt(process.env.OPENAI_TIMEOUT_MS || '3000', 10),
} as const;
