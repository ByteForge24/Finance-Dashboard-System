/**
 * AI Insights Generator Service
 *
 * Optional AI enhancement layer for monthly spending insights.
 * Takes deterministic monthly insights data and produces a richer narrative
 * using OpenAI API, with graceful fallback to deterministic narrative.
 *
 * - If AI is not configured: returns deterministic narrative, source: 'generated'
 * - If AI fails (timeout, error, malformed response): returns deterministic narrative, source: 'generated'
 * - If AI succeeds: returns AI-enhanced narrative, source: 'ai'
 *
 * Never modifies highlights, categories, or numeric metrics.
 * These remain deterministic and fact-based at all times.
 *
 * This service is optional; deterministic generation always works.
 */

import { AIConfig } from '../../config/ai-config.js';
import {
  MonthlyInsightsResponse,
  InsightSource,
} from './dashboard.types.js';

// Dynamic import to make openai optional
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let OpenAI: any = null;
let openaiLoadFailed = false;

async function getOpenAIClient() {
  if (openaiLoadFailed) {
    return null;
  }
  if (!OpenAI) {
    try {
      // @ts-expect-error - openai is optional dependency
      // eslint-disable-next-line import/no-extraneous-dependencies
      const mod = await import('openai');
      OpenAI = mod.default;
    } catch (_e) {
      openaiLoadFailed = true;
      return null;
    }
  }
  return OpenAI;
}

/**
 * Build a prompt for narrative enhancement
 * Instructs AI to create a concise, factual summary based on provided data
 */
function buildNarrativePrompt(insights: MonthlyInsightsResponse): string {
  const { month, summary, highlights } = insights;
  const [yearStr, monthStr] = month.split('-');
  const monthNum = parseInt(monthStr, 10);
  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  const monthName = monthNames[monthNum - 1];

  const highlightsSummary = highlights
    .map((h) => `- ${h.message}`)
    .join('\n');

  return `You are a financial advisor helping users understand their monthly spending. Your task is to create a concise, professional, 2-3 sentence natural-language summary of a user's spending insights.

Month: ${monthName} ${yearStr}
Total Income: $${summary.totalIncome.toFixed(2)}
Total Expenses: $${summary.totalExpense.toFixed(2)}
Net Balance: $${summary.netBalance.toFixed(2)}
Transaction Count: ${summary.transactionCount}

Key Insights:
${highlightsSummary}

Requirements:
1. Keep the narrative to 2-3 sentences maximum
2. Use only the facts provided above; do not invent data
3. Write in a professional but conversational tone
4. Begin with "In ${monthName}..." or similar
5. Include the bottom line (net balance or key takeaway)
6. Do NOT include specific dollar transactions not in the insights above
7. Keep it actionable and insightful

Write the narrative now:`;
}

/**
 * Validate AI response
 * Ensures response is non-empty and reasonable
 */
function validateAIResponse(text: string | null | undefined): boolean {
  if (!text || typeof text !== 'string') {
    return false;
  }

  const trimmed = text.trim();

  // Must be at least 20 characters and at most 500 characters
  if (trimmed.length < 20 || trimmed.length > 500) {
    return false;
  }

  // Should not contain suspicious patterns
  if (trimmed.toLowerCase().includes('i cannot') ||
      trimmed.toLowerCase().includes('i do not have') ||
      trimmed.toLowerCase().includes('[error') ||
      trimmed.toLowerCase().includes('[invalid') ||
      trimmed.includes('$$$') ||
      trimmed.includes('...')) {
    return false;
  }

  return true;
}

/**
 * Extract narrative content from OpenAI response
 */
function extractNarrative(response: any): string | null {
  try {
    const content = response?.choices?.[0]?.message?.content?.trim();
    if (validateAIResponse(content)) {
      return content;
    }
    return null;
  } catch (_e) {
    return null;
  }
}

/**
 * Enhance monthly insights narrative with AI
 *
 * Public API:
 * - Input: insights from deterministic phase (Phase 3)
 * - Output: new insights object with AI-enhanced narrative and source flag updated
 * - Fallback: automatically uses deterministic narrative if AI unavailable
 *
 * Never modifies highlights, categories, or metrics - these stay deterministic.
 */
export async function enhanceMonthlyInsightsNarrative(
  insights: MonthlyInsightsResponse
): Promise<MonthlyInsightsResponse> {
  // If AI is not configured, return with deterministic narrative as-is
  if (!AIConfig.enabled || !AIConfig.apiKey) {
    return insights;
  }

  // If no transactions, AI enhancement not needed
  if (insights.summary.transactionCount === 0) {
    return insights;
  }

  try {
    const ClientClass = await getOpenAIClient();
    if (!ClientClass) {
      // OpenAI package not available, use deterministic
      return insights;
    }

    const client = new ClientClass({ apiKey: AIConfig.apiKey });

    // Build prompt
    const prompt = buildNarrativePrompt(insights);

    // Call OpenAI with timeout (5 seconds)
    const timeoutPromise = new Promise<null>((resolve) => {
      setTimeout(() => resolve(null), 5000);
    });

    const response = await Promise.race([
      client.chat.completions.create({
        model: AIConfig.model,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.5,
        max_tokens: 200,
      }),
      timeoutPromise,
    ]);

    // Handle timeout
    if (response === null) {
      console.warn('OpenAI insights narrative generation timed out; using deterministic narrative');
      return insights;
    }

    // Extract and validate AI narrative
    const aiNarrative = extractNarrative(response);

    if (!aiNarrative) {
      console.warn('OpenAI insights narrative generation produced invalid response; using deterministic narrative');
      return insights;
    }

    // Success: return enhanced insights with AI narrative and source flag
    return {
      ...insights,
      narrative: aiNarrative,
      source: 'ai',
    };
  } catch (error) {
    // Log error but don't throw; fall back to deterministic
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.warn(`OpenAI insights narrative generation failed: ${errorMsg}; using deterministic narrative`);
    return insights;
  }
}

/**
 * Alternative API if you prefer separate return shape
 * Returns just the enhanced narrative and source
 *
 * Useful if you want to enhance at the service level before assembling response
 */
export async function enhanceNarrative(
  deterministicNarrative: string,
  insights: MonthlyInsightsResponse
): Promise<{ narrative: string; source: InsightSource }> {
  const enhanced = await enhanceMonthlyInsightsNarrative({
    ...insights,
    narrative: deterministicNarrative,
    source: 'generated',
  });

  return {
    narrative: enhanced.narrative,
    source: enhanced.source,
  };
}
