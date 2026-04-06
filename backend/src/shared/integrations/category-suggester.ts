/**
 * Category Suggester Interface
 *
 * Provides abstraction for suggesting expense/income categories based on transaction notes.
 * Implementations may use AI, keyword matching, or other strategies.
 */

import { ConfidenceLevel, SuggestionSource, SuggestCategoryOutput } from '../../modules/records/records.types.js';

export interface CategorySuggester {
  /**
   * Suggest a category for a financial transaction
   *
   * @param notes - Transaction description/notes (required)
   * @param type - Transaction type: 'income' or 'expense' (optional, helps context)
   * @param amount - Transaction amount in base currency (optional, helps context)
   * @returns Suggestion with primary category, alternatives, confidence, and source
   */
  suggest(
    notes: string,
    type?: 'income' | 'expense',
    amount?: number
  ): Promise<SuggestCategoryOutput>;
}

/**
 * Internal type for normalized suggestion result
 * Before being returned to API clients, alternative must be deduplicated
 */
export interface InternalSuggestionResult {
  suggestedCategory: string | null;
  candidates: string[];  // Not yet deduplicated or limited
  confidence: ConfidenceLevel;
  source: SuggestionSource;
  reason?: string;
}
