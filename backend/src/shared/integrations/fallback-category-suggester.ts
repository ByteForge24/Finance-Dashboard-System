/**
 * Fallback Category Suggester
 *
 * Provides deterministic, keyword-based category suggestions.
 * Works offline without external API calls.
 * Used when OpenAI is disabled, unavailable, or times out.
 */

import prisma from '../../config/prisma.js';
import { ConfidenceLevel, SuggestCategoryOutput } from '../../modules/records/records.types.js';
import { CategorySuggester, InternalSuggestionResult } from './category-suggester.js';

interface KeywordMap {
  [key: string]: { category: string; weight: number }[];
}

/**
 * Keyword mappings for common expense/income categories
 * Maps transaction keywords to suggested categories with scoring weight
 */
const KEYWORD_MAP: KeywordMap = {
  // Groceries & Food
  grocery: [{ category: 'Groceries', weight: 100 }],
  groceries: [{ category: 'Groceries', weight: 100 }],
  supermarket: [{ category: 'Groceries', weight: 90 }],
  market: [{ category: 'Groceries', weight: 70 }],
  food: [{ category: 'Food', weight: 80 }],
  restaurant: [{ category: 'Food', weight: 90 }],
  dining: [{ category: 'Food', weight: 90 }],
  cafe: [{ category: 'Food', weight: 85 }],
  coffee: [{ category: 'Food', weight: 80 }],
  lunch: [{ category: 'Food', weight: 80 }],
  dinner: [{ category: 'Food', weight: 80 }],

  // Utilities & Housing
  utility: [{ category: 'Utilities', weight: 100 }],
  utilities: [{ category: 'Utilities', weight: 100 }],
  electric: [{ category: 'Utilities', weight: 95 }],
  electricity: [{ category: 'Utilities', weight: 95 }],
  water: [{ category: 'Utilities', weight: 90 }],
  internet: [{ category: 'Utilities', weight: 90 }],
  phone: [{ category: 'Utilities', weight: 80 }],
  gas: [{ category: 'Utilities', weight: 85 }],
  rent: [{ category: 'Rent', weight: 100 }],
  housing: [{ category: 'Housing', weight: 80 }],
  mortgage: [{ category: 'Housing', weight: 90 }],

  // Transportation
  uber: [{ category: 'Transportation', weight: 100 }],
  taxi: [{ category: 'Transportation', weight: 100 }],
  lyft: [{ category: 'Transportation', weight: 100 }],
  gasoline: [{ category: 'Transportation', weight: 90 }],
  fuel: [{ category: 'Transportation', weight: 95 }],
  parking: [{ category: 'Transportation', weight: 95 }],
  metro: [{ category: 'Transportation', weight: 90 }],
  transit: [{ category: 'Transportation', weight: 90 }],
  bus: [{ category: 'Transportation', weight: 85 }],
  train: [{ category: 'Transportation', weight: 85 }],

  // Salary & Income
  salary: [{ category: 'Salary', weight: 100 }],
  payroll: [{ category: 'Salary', weight: 95 }],
  wages: [{ category: 'Salary', weight: 95 }],
  paycheck: [{ category: 'Salary', weight: 95 }],
  income: [{ category: 'Income', weight: 80 }],
  bonus: [{ category: 'Salary', weight: 90 }],

  // Freelance & Projects
  freelance: [{ category: 'Freelance', weight: 100 }],
  client: [{ category: 'Freelance', weight: 85 }],
  project: [{ category: 'Freelance', weight: 75 }],
  payment: [{ category: 'Income', weight: 75 }],

  // Entertainment
  movie: [{ category: 'Entertainment', weight: 100 }],
  netflix: [{ category: 'Entertainment', weight: 100 }],
  spotify: [{ category: 'Entertainment', weight: 100 }],
  game: [{ category: 'Entertainment', weight: 90 }],
  entertainment: [{ category: 'Entertainment', weight: 100 }],
  cinema: [{ category: 'Entertainment', weight: 95 }],
  theater: [{ category: 'Entertainment', weight: 95 }],
  concert: [{ category: 'Entertainment', weight: 95 }],

  // Shopping & Retail
  shopping: [{ category: 'Shopping', weight: 90 }],
  amazon: [{ category: 'Shopping', weight: 95 }],
  retail: [{ category: 'Shopping', weight: 85 }],
  store: [{ category: 'Shopping', weight: 75 }],

  // Medical
  doctor: [{ category: 'Medical', weight: 100 }],
  pharmacy: [{ category: 'Medical', weight: 100 }],
  medical: [{ category: 'Medical', weight: 100 }],
  hospital: [{ category: 'Medical', weight: 95 }],
  health: [{ category: 'Medical', weight: 90 }],

  // Fitness
  gym: [{ category: 'Fitness', weight: 100 }],
  fitness: [{ category: 'Fitness', weight: 100 }],
  yoga: [{ category: 'Fitness', weight: 95 }],
  sports: [{ category: 'Fitness', weight: 90 }],

  // Investment
  investment: [{ category: 'Investment', weight: 100 }],
  stock: [{ category: 'Investment', weight: 95 }],
  dividend: [{ category: 'Investment', weight: 90 }],
  crypto: [{ category: 'Investment', weight: 95 }],
};

export class FallbackCategorySuggester implements CategorySuggester {
  /**
   * Suggest a category using keyword matching against transaction notes
   * and historical categories from the database.
   */
  async suggest(
    notes: string,
    type?: 'income' | 'expense',
    _amount?: number
  ): Promise<SuggestCategoryOutput> {
    // Load historical categories from database (excluding soft-deleted records)
    const historicalRecords = await prisma.financialRecord.findMany({
      where: { deletedAt: null },
      select: { category: true },
      distinct: ['category'],
    });

    const historicalCategories = historicalRecords.map((r) => r.category);
    const historicalSet = new Set(historicalCategories.map((c) => c.toLowerCase()));

    // Score candidates from keyword matching
    const candidates = new Map<string, number>();
    const lowerNotes = notes.toLowerCase();

    // Match keywords
    for (const [keyword, suggestions] of Object.entries(KEYWORD_MAP)) {
      if (lowerNotes.includes(keyword)) {
        for (const { category, weight } of suggestions) {
          const current = candidates.get(category) || 0;
          candidates.set(category, current + weight);
        }
      }
    }

    // Prefer categories that match the provided type
    if (type === 'income') {
      // Boost income-related categories
      const incomeCategories = ['Salary', 'Freelance', 'Investment', 'Bonus', 'Income'];
      for (const cat of incomeCategories) {
        if (candidates.has(cat)) {
          candidates.set(cat, candidates.get(cat)! + 20);
        }
      }
    } else if (type === 'expense') {
      // Naturally filters to expense categories
    }

    // Sort by score
    const sorted = Array.from(candidates.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([category]) => category);

    // Normalize suggestions to actual DB categories
    const normalized = this.normalizeCategories(sorted, historicalCategories);
    const suggested = normalized[0] || null;
    const alternatives = normalized.slice(1, 4);

    // Determine confidence based on score
    const confidence = this.calculateConfidence(sorted.length, candidates.get(sorted[0]) || 0);

    return {
      suggestedCategory: suggested,
      alternatives: this.deduplicateAlternatives(suggested, alternatives),
      confidence,
      source: 'fallback',
      reason: suggested
        ? `Matched keyword(s) in notes against historical categories`
        : `No matching categories found; consider creating a new category`,
    };
  }

  /**
   * Normalize suggested categories to existing DB category names (case-insensitive match)
   */
  private normalizeCategories(suggested: string[], existing: string[]): string[] {
    const existingLower = new Map(existing.map((c) => [c.toLowerCase(), c]));

    return suggested
      .map((s) => {
        // Try exact case-insensitive match first
        const normalized = existingLower.get(s.toLowerCase());
        return normalized || s;
      });
  }

  /**
   * Calculate confidence level based on match quality
   */
  private calculateConfidence(matchCount: number, topScore: number): ConfidenceLevel {
    if (matchCount === 0) return 'low';
    if (topScore >= 80) return 'high';
    if (topScore >= 50) return 'medium';
    return 'low';
  }

  /**
   * Remove duplicates and ensure suggestedCategory is not in alternatives
   */
  private deduplicateAlternatives(suggested: string | null, alternatives: string[]): string[] {
    const seen = new Set<string>();
    if (suggested) {
      seen.add(suggested.toLowerCase());
    }

    const result: string[] = [];
    for (const alt of alternatives) {
      const lower = alt.toLowerCase();
      if (!seen.has(lower)) {
        result.push(alt);
        seen.add(lower);
      }
    }
    return result.slice(0, 3);
  }
}
