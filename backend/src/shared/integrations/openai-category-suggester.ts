/**
 * OpenAI Category Suggester
 *
 * Uses OpenAI GPT API to intelligently suggest expense/income categories.
 * Falls back gracefully to non-AI suggestions on any error or timeout.
 * Never throws errors to the API caller; always returns a valid response.
 */

import { AIConfig } from '../../config/ai-config.js';
import { SuggestCategoryOutput } from '../../modules/records/records.types.js';
import { CategorySuggester } from './category-suggester.js';
import { FallbackCategorySuggester } from './fallback-category-suggester.js';
import prisma from '../../config/prisma.js';

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

export class OpenAICategorySuggester implements CategorySuggester {
  private fallback: FallbackCategorySuggester;
  private historicalCategoriesCache: string[] | null = null;
  private cacheTime: number = 0;
  private readonly CACHE_TTL = 60000; // 1 minute

  constructor() {
    this.fallback = new FallbackCategorySuggester();
  }

  /**
   * Suggest a category using OpenAI API with fallback on any error
   */
  async suggest(
    notes: string,
    type?: 'income' | 'expense',
    amount?: number
  ): Promise<SuggestCategoryOutput> {
    // If no API key, skip AI and go straight to fallback
    if (!AIConfig.apiKey) {
      return this.fallback.suggest(notes, type, amount);
    }

    try {
      const ClientClass = await getOpenAIClient();
      if (!ClientClass) {
        return this.fallback.suggest(notes, type, amount);
      }

      const client = new ClientClass({ apiKey: AIConfig.apiKey });

      // Get historical categories for context
      const historicalCategories = await this.getHistoricalCategories();

      // Build prompt with context
      const prompt = this.buildPrompt(notes, type, amount, historicalCategories);

      // Call OpenAI with timeout
      const timeoutPromise = new Promise<null>((resolve) => {
        setTimeout(() => resolve(null), AIConfig.timeoutMs);
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
          temperature: 0.3,
          max_tokens: 100,
        }),
        timeoutPromise,
      ]);

      // Handle timeout
      if (response === null) {
        console.warn('OpenAI API call timed out; using fallback suggestions');
        return this.fallback.suggest(notes, type, amount);
      }

      // Parse response
      const aiSuggestion = this.parseOpenAIResponse(response, historicalCategories);

      return {
        suggestedCategory: aiSuggestion.suggestedCategory,
        alternatives: aiSuggestion.alternatives,
        confidence: aiSuggestion.confidence,
        source: 'ai',
      };
    } catch (error) {
      // Log error but don't throw; fall back gracefully
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.warn(`OpenAI category suggestion failed: ${errorMsg}; using fallback`);
      return this.fallback.suggest(notes, type, amount);
    }
  }

  /**
   * Get historical categories from database (with simple cache)
   */
  private async getHistoricalCategories(): Promise<string[]> {
    const now = Date.now();
    if (this.historicalCategoriesCache && now - this.cacheTime < this.CACHE_TTL) {
      return this.historicalCategoriesCache;
    }

    const records = await prisma.financialRecord.findMany({
      where: { deletedAt: null },
      select: { category: true },
      distinct: ['category'],
    });

    this.historicalCategoriesCache = records.map((r) => r.category);
    this.cacheTime = now;
    return this.historicalCategoriesCache;
  }

  /**
   * Build the prompt for OpenAI
   */
  private buildPrompt(
    notes: string,
    type: 'income' | 'expense' | undefined,
    amount: number | undefined,
    historicalCategories: string[]
  ): string {
    const typeContext = type ? ` This is an ${type} transaction.` : '';
    const amountContext = amount ? ` The amount is $${amount}.` : '';
    const categoryContext =
      historicalCategories.length > 0
        ? `\n\nExisting categories in the system: ${historicalCategories.join(', ')}`
        : '';

    return `You are a financial category classifier. Given a transaction note, suggest the most appropriate category.

Transaction note: "${notes}"${typeContext}${amountContext}${categoryContext}

Respond with ONLY:
1. A single word or two-word category name (e.g., "Groceries", "Utilities", "Salary")
2. A comma-separated list of up to 2 alternative categories

Format your response as: Category | Alternative1, Alternative2

Examples:
- "Groceries | Food, Shopping"
- "Salary | Income, Freelance"
- "Utilities | Housing, Rent"

Respond now:`;
  }

  /**
   * Parse OpenAI response and normalize to existing categories
   */
  private parseOpenAIResponse(
    response: any,
    historicalCategories: string[]
  ): {
    suggestedCategory: string | null;
    alternatives: string[];
    confidence: 'high' | 'medium' | 'low';
  } {
    try {
      const content = response.choices?.[0]?.message?.content?.trim() || '';
      const parts = content.split('|');

      if (parts.length < 1) {
        return { suggestedCategory: null, alternatives: [], confidence: 'low' };
      }

      const suggested = parts[0].trim();
      const altText = parts[1]?.trim() || '';
      const alternatives = altText
        .split(',')
        .map((a: string) => a.trim())
        .filter((a: string) => a.length > 0);

      // Normalize suggestions to existing DB categories
      const historicalLower = new Map(
        historicalCategories.map((c: string) => [c.toLowerCase(), c])
      );

      const suggestedNorm =
        historicalLower.get(suggested.toLowerCase()) || suggested;
      const altNorm = alternatives
        .map((a: string) => historicalLower.get(a.toLowerCase()) || a)
        .filter((a: string) => a !== suggestedNorm)
        .slice(0, 3);

      return {
        suggestedCategory: suggestedNorm || null,
        alternatives: altNorm,
        confidence: 'high',
      };
    } catch (_error) {
      // If parsing fails, return null suggestion
      return { suggestedCategory: null, alternatives: [], confidence: 'low' };
    }
  }
}
