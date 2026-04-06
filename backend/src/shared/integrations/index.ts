/**
 * Integrations - Exports
 */

export type { CategorySuggester } from './category-suggester.js';
export { FallbackCategorySuggester } from './fallback-category-suggester.js';
export { OpenAICategorySuggester } from './openai-category-suggester.js';

import { AIConfig } from '../../config/ai-config.js';
import { FallbackCategorySuggester } from './fallback-category-suggester.js';
import { OpenAICategorySuggester } from './openai-category-suggester.js';
import type { CategorySuggester } from './category-suggester.js';

/**
 * Initialize and return the appropriate category suggester
 * Uses OpenAI if configured, otherwise uses fallback
 */
export function initializeCategorySuggester(): CategorySuggester {
  if (AIConfig.enabled) {
    console.log(`Using OpenAI category suggester (model: ${AIConfig.model})`);
    return new OpenAICategorySuggester();
  } else {
    console.log('Using fallback category suggester (no OpenAI API key configured)');
    return new FallbackCategorySuggester();
  }
}
