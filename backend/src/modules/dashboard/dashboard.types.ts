/**
 * Dashboard Module Types
 *
 * Defines request/response types for dashboard endpoints including monthly insights.
 */

// ============================================================================
// Monthly Insights - Core Types
// ============================================================================

export type HighlightType = 'trend' | 'increase' | 'decrease' | 'anomaly' | 'milestone';
export type InsightSource = 'ai' | 'generated';

export interface MonthlyInsightsSummary {
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  transactionCount: number;
}

export interface MonthlyInsightHighlight {
  type: HighlightType;
  message: string;
  category?: string;
  value?: number;
  previousValue?: number;
}

export interface MonthlyInsightCategory {
  category: string;
  amount: number;
  percentOfTotal: number;
  transactionCount: number;
}

export interface MonthlyInsightsResponse {
  month: string;
  summary: MonthlyInsightsSummary;
  narrative: string;
  source: InsightSource;
  highlights: MonthlyInsightHighlight[];
  topExpenseCategories: MonthlyInsightCategory[];
  topIncomeCategories: MonthlyInsightCategory[];
}

// ============================================================================
// Monthly Insights - Input/Query Types
// ============================================================================

export interface MonthlyInsightsQuery {
  month?: string; // YYYY-MM format
}

// ============================================================================
// Internal: Insights data structure (intermediate)
// ============================================================================

export interface MonthAggregateData {
  month: string; // YYYY-MM
  totalIncome: number;
  totalExpense: number;
  transactionCount: number;
  expenseCategories: Array<{
    category: string;
    amount: number;
    count: number;
  }>;
  incomeCategories: Array<{
    category: string;
    amount: number;
    count: number;
  }>;
  previousMonthExpense?: number; // For month-over-month comparison
}
