/// <reference types="jest" />
/**
 * Unit Tests for Insights Generator Service
 *
 * Tests deterministic narrative and highlight generation logic.
 * Tests contract compliance and edge cases.
 */

import { generateMonthlyInsights } from '../../src/modules/dashboard/insights-generator.service.js';
import type { MonthAggregateData } from '../../src/modules/dashboard/dashboard.types.js';

// Mock module for insights generator (allows testing pure logic)
// We'll use the real function calls to test behavior given known data

describe('Insights Generator - Unit Tests', () => {
  describe('Month parsing', () => {
    it('should parse valid YYYY-MM format', async () => {
      // Test that valid month formats are accepted
      // We can infer this from the function accepting valid months without error
      const result = await generateMonthlyInsights('2026-03');
      expect(result).toBeDefined();
      expect(result.month).toBe('2026-03');
    });

    it('should default to current month when not provided', async () => {
      const result = await generateMonthlyInsights();

      const currentDate = new Date();
      const expectedMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(
        2,
        '0'
      )}`;

      expect(result.month).toBe(expectedMonth);
    });

    it('should throw error on invalid month format', async () => {
      const invalidMonths = ['2026/03', 'march-2026', '03-2026', '2026', '2026-13', '2026-00'];

      for (const invalidMonth of invalidMonths) {
        try {
          await generateMonthlyInsights(invalidMonth);
          fail(`Should have thrown error for invalid month: ${invalidMonth}`);
        } catch (error) {
          expect(error).toBeDefined();
          expect((error as Error).message).toContain('Invalid month format');
        }
      }
    });
  });

  describe('Response contract validation', () => {
    it('should return all required fields', async () => {
      const result = await generateMonthlyInsights('2026-03');

      expect(result).toHaveProperty('month');
      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('narrative');
      expect(result).toHaveProperty('source');
      expect(result).toHaveProperty('highlights');
      expect(result).toHaveProperty('topExpenseCategories');
      expect(result).toHaveProperty('topIncomeCategories');
    });

    it('source should always be "generated" (not "ai") from generator service', async () => {
      const result = await generateMonthlyInsights('2026-03');

      expect(result.source).toBe('generated');
    });

    it('narrative should be non-empty string', async () => {
      const result = await generateMonthlyInsights('2026-03');

      expect(typeof result.narrative).toBe('string');
      expect(result.narrative.length).toBeGreaterThan(0);
    });

    it('highlights should be array', async () => {
      const result = await generateMonthlyInsights('2026-03');

      expect(Array.isArray(result.highlights)).toBe(true);
    });

    it('topExpenseCategories should be array', async () => {
      const result = await generateMonthlyInsights('2026-03');

      expect(Array.isArray(result.topExpenseCategories)).toBe(true);
    });

    it('topIncomeCategories should be array', async () => {
      const result = await generateMonthlyInsights('2026-03');

      expect(Array.isArray(result.topIncomeCategories)).toBe(true);
    });
  });

  describe('Highlight generation', () => {
    it('should return empty highlights array for month with no data', async () => {
      const result = await generateMonthlyInsights('2020-01');

      expect(result.highlights).toEqual([]);
    });

    it('highlights should have required structure when present', async () => {
      const result = await generateMonthlyInsights('2026-03');

      result.highlights.forEach((highlight) => {
        expect(highlight).toHaveProperty('type');
        expect(highlight).toHaveProperty('message');
        expect(['trend', 'increase', 'decrease', 'anomaly', 'milestone']).toContain(highlight.type);
        expect(typeof highlight.message).toBe('string');
        expect(highlight.message.length).toBeGreaterThan(0);
      });
    });

    it('highlight optional fields should be properly typed', async () => {
      const result = await generateMonthlyInsights('2026-03');

      result.highlights.forEach((highlight) => {
        if (highlight.category !== undefined) {
          expect(typeof highlight.category).toBe('string');
        }
        if (highlight.value !== undefined) {
          expect(typeof highlight.value).toBe('number');
          expect(highlight.value).toBeGreaterThanOrEqual(0);
        }
        if (highlight.previousValue !== undefined) {
          expect(typeof highlight.previousValue).toBe('number');
        }
      });
    });

    it('should generate valid highlights for month with activity', async () => {
      const result = await generateMonthlyInsights('2026-03');

      // If there is activity (non-zero summary), we should have highlights
      const hasActivity =
        result.summary.totalIncome > 0 ||
        result.summary.totalExpense > 0 ||
        result.summary.transactionCount > 0;

      if (hasActivity) {
        expect(result.highlights.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Summary data', () => {
    it('summary totals should match math', async () => {
      const result = await generateMonthlyInsights('2026-03');

      const { totalIncome, totalExpense, netBalance } = result.summary;

      expect(netBalance).toBe(totalIncome - totalExpense);
    });

    it('summary should have non-negative values', async () => {
      const result = await generateMonthlyInsights('2026-03');

      expect(result.summary.totalIncome).toBeGreaterThanOrEqual(0);
      expect(result.summary.totalExpense).toBeGreaterThanOrEqual(0);
      expect(result.summary.transactionCount).toBeGreaterThanOrEqual(0);
    });

    it('empty month should have zero summary values', async () => {
      const result = await generateMonthlyInsights('2020-01');

      expect(result.summary.totalIncome).toBe(0);
      expect(result.summary.totalExpense).toBe(0);
      expect(result.summary.netBalance).toBe(0);
      expect(result.summary.transactionCount).toBe(0);
    });

    it('transaction count should match activity level', async () => {
      const result = await generateMonthlyInsights('2026-03');

      if (result.summary.totalIncome > 0 || result.summary.totalExpense > 0) {
        expect(result.summary.transactionCount).toBeGreaterThan(0);
      }
    });
  });

  describe('Category breakdown', () => {
    it('categories should be limited to top 3', async () => {
      const result = await generateMonthlyInsights('2026-03');

      expect(result.topExpenseCategories.length).toBeLessThanOrEqual(3);
      expect(result.topIncomeCategories.length).toBeLessThanOrEqual(3);
    });

    it('categories should be sorted by amount (descending)', async () => {
      const result = await generateMonthlyInsights('2026-03');

      if (result.topExpenseCategories.length > 1) {
        for (let i = 1; i < result.topExpenseCategories.length; i++) {
          expect(result.topExpenseCategories[i - 1].amount).toBeGreaterThanOrEqual(
            result.topExpenseCategories[i].amount
          );
        }
      }

      if (result.topIncomeCategories.length > 1) {
        for (let i = 1; i < result.topIncomeCategories.length; i++) {
          expect(result.topIncomeCategories[i - 1].amount).toBeGreaterThanOrEqual(
            result.topIncomeCategories[i].amount
          );
        }
      }
    });

    it('category percentOfTotal should be 0-100', async () => {
      const result = await generateMonthlyInsights('2026-03');

      result.topExpenseCategories.forEach((cat) => {
        expect(cat.percentOfTotal).toBeGreaterThanOrEqual(0);
        expect(cat.percentOfTotal).toBeLessThanOrEqual(100);
      });

      result.topIncomeCategories.forEach((cat) => {
        expect(cat.percentOfTotal).toBeGreaterThanOrEqual(0);
        expect(cat.percentOfTotal).toBeLessThanOrEqual(100);
      });
    });

    it('category should have required structure', async () => {
      const result = await generateMonthlyInsights('2026-03');

      result.topExpenseCategories.forEach((cat) => {
        expect(cat).toHaveProperty('category');
        expect(cat).toHaveProperty('amount');
        expect(cat).toHaveProperty('percentOfTotal');
        expect(cat).toHaveProperty('transactionCount');
        expect(typeof cat.category).toBe('string');
        expect(typeof cat.amount).toBe('number');
        expect(typeof cat.percentOfTotal).toBe('number');
        expect(typeof cat.transactionCount).toBe('number');
      });
    });

    it('no-data month should have empty category arrays', async () => {
      const result = await generateMonthlyInsights('2020-01');

      expect(result.topExpenseCategories).toEqual([]);
      expect(result.topIncomeCategories).toEqual([]);
    });

    it('expense categories should only appear in topExpenseCategories', async () => {
      const result = await generateMonthlyInsights('2026-03');

      const incomeCategories = result.topIncomeCategories.map((c) => c.category);
      const expenseCategories = result.topExpenseCategories.map((c) => c.category);

      // These arrays should not overlap (categories are either income or expense)
      const overlap = incomeCategories.filter((c) => expenseCategories.includes(c));
      expect(overlap.length).toBe(0);
    });
  });

  describe('Narrative generation', () => {
    it('narrative should mention the month', async () => {
      const result = await generateMonthlyInsights('2026-03');

      expect(result.narrative).toMatch(/March|2026/);
    });

    it('no-data month narrative should indicate no activity', async () => {
      const result = await generateMonthlyInsights('2020-01');

      expect(result.narrative.toLowerCase()).toContain('no');
      expect(result.narrative.toLowerCase()).toMatch(/no.*activity|not.*recorded|empty/);
    });

    it('month with activity should have detailed narrative', async () => {
      const result = await generateMonthlyInsights('2026-03');

      if (result.summary.transactionCount > 0) {
        expect(result.narrative.length).toBeGreaterThan(20); // More than just "No activity..."
      }
    });

    it('narrative should include dollar amounts for active months', async () => {
      const result = await generateMonthlyInsights('2026-03');

      if (result.summary.totalExpense > 0 || result.summary.totalIncome > 0) {
        expect(result.narrative).toMatch(/\$[\d.]+/); // At least one dollar amount
      }
    });
  });

  describe('Month format handling', () => {
    it('should handle January format correctly', async () => {
      const result = await generateMonthlyInsights('2026-01');

      expect(result.month).toBe('2026-01');
      // Narrative exists but content depends on data availability
      expect(typeof result.narrative).toBe('string');
      expect(result.narrative.length).toBeGreaterThan(0);
    });

    it('should handle December format correctly', async () => {
      const pastYear = new Date().getFullYear() - 1;
      const result = await generateMonthlyInsights(`${pastYear}-12`);

      expect(result.month).toBe(`${pastYear}-12`);
      expect(typeof result.narrative).toBe('string');
    });

    it('should consistently format month as YYYY-MM in response', async () => {
      const result = await generateMonthlyInsights('2026-03');

      expect(result.month).toMatch(/^\d{4}-\d{2}$/);
      expect(result.month).toBe('2026-03');
    });
  });

  describe('Deterministic output (consistency)', () => {
    it('same month should produce same response structure', async () => {
      const result1 = await generateMonthlyInsights('2026-03');
      const result2 = await generateMonthlyInsights('2026-03');

      // Response structure should be identical (same data)
      expect(result1.month).toBe(result2.month);
      expect(result1.summary).toEqual(result2.summary);
      expect(result1.highlights.length).toBe(result2.highlights.length);
      expect(result1.topExpenseCategories.length).toBe(result2.topExpenseCategories.length);
    });

    it('should always mark source as "generated" not "ai"', async () => {
      const result1 = await generateMonthlyInsights('2026-03');
      const result2 = await generateMonthlyInsights();

      expect(result1.source).toBe('generated');
      expect(result2.source).toBe('generated');
    });
  });

  describe('Edge cases', () => {
    it('should handle Dec of previous year', async () => {
      const prevYear = new Date().getFullYear() - 1;
      const result = await generateMonthlyInsights(`${prevYear}-12`);

      expect(result).toBeDefined();
      expect(result.month).toBe(`${prevYear}-12`);
    });

    it('response always has valid structure even for months without data', async () => {
      const result = await generateMonthlyInsights('2020-06');

      // Even with no data, structure should be complete
      expect(result).toHaveProperty('month');
      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('narrative');
      expect(result).toHaveProperty('source');
      expect(result).toHaveProperty('highlights');
      expect(result).toHaveProperty('topExpenseCategories');
      expect(result).toHaveProperty('topIncomeCategories');
    });
  });
});
