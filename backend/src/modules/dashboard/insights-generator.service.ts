/**
 * Insights Generator Service
 *
 * Generates deterministic, non-AI monthly spending insights from aggregated data.
 * Uses existing dashboard data (summary, category breakdown, trends) to produce
 * facts-based narrative and highlights without requiring AI.
 *
 * This service is the foundation; AIInsightsGenerator can optionally enhance
 * the narrative with AI-generated text in later phases.
 */

import { Prisma } from '@prisma/client';
import prisma from '../../config/prisma.js';
import { startOfMonth, endOfMonth, startOfDay, endOfDay } from '../../shared/utils/date.js';
import {
  MonthlyInsightsResponse,
  MonthlyInsightsSummary,
  MonthlyInsightHighlight,
  MonthlyInsightCategory,
  MonthAggregateData,
} from './dashboard.types.js';

/**
 * Parse YYYY-MM format into month and year integers
 * Returns null if format is invalid
 */
function parseYearMonth(monthStr: string): { year: number; month: number } | null {
  const match = monthStr.match(/^(\d{4})-(\d{2})$/);
  if (!match) return null;

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);

  if (month < 1 || month > 12) return null;
  if (year < 1900) return null;

  return { year, month: month - 1 }; // month is 0-indexed for Date
}

/**
 * Format Date as YYYY-MM
 */
function formatYearMonth(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Aggregate data for a given month
 * Returns totals, categories, and counts
 */
async function aggregateMonthData(monthDate: Date): Promise<MonthAggregateData> {
  const startDate = startOfMonth(monthDate);
  const endDate = endOfMonth(monthDate);
  const month = formatYearMonth(monthDate);

  const where: Prisma.FinancialRecordWhereInput = {
    deletedAt: null,
    date: {
      gte: startOfDay(startDate),
      lte: endOfDay(endDate),
    },
  };

  // Get summary: income and expense totals
  const incomeResult = await prisma.financialRecord.aggregate({
    where: { ...where, type: 'INCOME' },
    _sum: { amount: true },
  });

  const expenseResult = await prisma.financialRecord.aggregate({
    where: { ...where, type: 'EXPENSE' },
    _sum: { amount: true },
  });

  const totalIncome = Number(incomeResult._sum.amount ?? 0);
  const totalExpense = Number(expenseResult._sum.amount ?? 0);

  // Get transaction count
  const transactionCount = await prisma.financialRecord.count({ where });

  // Get category breakdown for expenses
  const expenseGrouped = await prisma.financialRecord.groupBy({
    by: ['category'],
    where: { ...where, type: 'EXPENSE' },
    _sum: { amount: true },
    _count: true,
    orderBy: { _sum: { amount: 'desc' } },
  });

  const expenseCategories = expenseGrouped.map((row) => ({
    category: row.category,
    amount: Number(row._sum.amount ?? 0),
    count: row._count,
  }));

  // Get category breakdown for income
  const incomeGrouped = await prisma.financialRecord.groupBy({
    by: ['category'],
    where: { ...where, type: 'INCOME' },
    _sum: { amount: true },
    _count: true,
    orderBy: { _sum: { amount: 'desc' } },
  });

  const incomeCategories = incomeGrouped.map((row) => ({
    category: row.category,
    amount: Number(row._sum.amount ?? 0),
    count: row._count,
  }));

  return {
    month,
    totalIncome,
    totalExpense,
    transactionCount,
    expenseCategories,
    incomeCategories,
  };
}

/**
 * Generate a deterministic, templated narrative based on month data
 * Narrative is always present (never empty) and based on facts only
 */
function generateTemplatedNarrative(data: MonthAggregateData): string {
  const { month, totalIncome, totalExpense, transactionCount, expenseCategories } = data;

  // No data case
  if (transactionCount === 0) {
    return `No financial activity recorded for ${month}.`;
  }

  // Get month/year for display
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
  const year = yearStr;

  const netBalance = totalIncome - totalExpense;

  // Build narrative template
  let narrative = `In ${monthName} ${year}, `;

  if (totalIncome === 0 && totalExpense > 0) {
    narrative += `you spent $${totalExpense.toFixed(2)} across ${transactionCount} transactions.`;
  } else if (totalExpense === 0 && totalIncome > 0) {
    narrative += `you earned $${totalIncome.toFixed(2)} from ${transactionCount} transactions.`;
  } else {
    narrative += `your income was $${totalIncome.toFixed(2)} and expenses were $${totalExpense.toFixed(2)}, `;
    narrative += `leaving a net balance of $${netBalance.toFixed(2)}.`;
  }

  // Add top category insight if available
  if (expenseCategories.length > 0) {
    const topCategory = expenseCategories[0];
    const percentOfTotal = totalExpense > 0 ? Math.round((topCategory.amount / totalExpense) * 100) : 0;
    narrative += ` Your top expense category was ${topCategory.category} at $${topCategory.amount.toFixed(2)} (${percentOfTotal}% of expenses).`;
  }

  return narrative;
}

/**
 * Format category amount as MonthlyInsightCategory
 */
function formatCategoryInsight(
  category: { category: string; amount: number; count: number },
  total: number
): MonthlyInsightCategory {
  return {
    category: category.category,
    amount: category.amount,
    percentOfTotal: total > 0 ? Math.round((category.amount / total) * 100 * 100) / 100 : 0,
    transactionCount: category.count,
  };
}

/**
 * Generate deterministic highlights
 * Facts-based insights generated from aggregates; no AI required
 */
function generateHighlights(data: MonthAggregateData): MonthlyInsightHighlight[] {
  const highlights: MonthlyInsightHighlight[] = [];
  const { totalIncome, totalExpense, transactionCount, expenseCategories, incomeCategories } = data;

  // No data case: return empty highlights
  if (transactionCount === 0) {
    return [];
  }

  // Highlight 1: Top expense category (trend)
  if (expenseCategories.length > 0) {
    const topExpense = expenseCategories[0];
    const pct = totalExpense > 0 ? Math.round((topExpense.amount / totalExpense) * 100) : 0;
    highlights.push({
      type: 'trend',
      message: `${topExpense.category} is ${pct}% of your expenses`,
      category: topExpense.category,
      value: topExpense.amount,
    });
  }

  // Highlight 2: Top income category (trend)
  if (incomeCategories.length > 0) {
    const topIncome = incomeCategories[0];
    const pct = totalIncome > 0 ? Math.round((topIncome.amount / totalIncome) * 100) : 0;
    highlights.push({
      type: 'trend',
      message: `${topIncome.category} is ${pct}% of your income`,
      category: topIncome.category,
      value: topIncome.amount,
    });
  }

  // Highlight 3: Expense share of income (anomaly if >100%)
  if (totalIncome > 0) {
    const expenseRatio = Math.round((totalExpense / totalIncome) * 100);
    if (expenseRatio > 100) {
      highlights.push({
        type: 'anomaly',
        message: `Expenses exceeded income by ${expenseRatio - 100}%`,
        value: totalExpense,
      });
    } else if (expenseRatio > 80) {
      highlights.push({
        type: 'trend',
        message: `Expenses consumed ${expenseRatio}% of income`,
        value: totalExpense,
      });
    }
  }

  // Highlight 4: Transaction count milestone
  // Show if notably high or low vs typical (arbitrary threshold: 5+ is considered active)
  if (transactionCount >= 5) {
    highlights.push({
      type: 'milestone',
      message: `${transactionCount} transactions recorded`,
      value: transactionCount,
    });
  } else if (transactionCount > 0) {
    highlights.push({
      type: 'milestone',
      message: `${transactionCount} transaction${transactionCount === 1 ? '' : 's'} recorded`,
      value: transactionCount,
    });
  }

  // Highlight 5: Net balance summary
  const netBalance = totalIncome - totalExpense;
  if (netBalance > 0) {
    highlights.push({
      type: 'milestone',
      message: `Net surplus of $${netBalance.toFixed(2)}`,
      value: netBalance,
    });
  } else if (netBalance < 0) {
    highlights.push({
      type: 'anomaly',
      message: `Net deficit of $${Math.abs(netBalance).toFixed(2)}`,
      value: Math.abs(netBalance),
    });
  }

  return highlights;
}

/**
 * Main function: Generate complete monthly insights response
 * Accepts month in YYYY-MM format or defaults to current month
 */
export async function generateMonthlyInsights(
  monthString?: string
): Promise<MonthlyInsightsResponse> {
  let targetMonth: Date;

  if (monthString) {
    const parsed = parseYearMonth(monthString);
    if (!parsed) {
      throw new Error(`Invalid month format: ${monthString}. Expected YYYY-MM.`);
    }
    targetMonth = new Date(parsed.year, parsed.month, 1);
  } else {
    // Default to current month
    const now = new Date();
    targetMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  // Aggregate month data
  const aggregates = await aggregateMonthData(targetMonth);

  // Generate narrative
  const narrative = generateTemplatedNarrative(aggregates);

  // Generate highlights
  const highlights = generateHighlights(aggregates);

  // Format top expense categories (top 3)
  const topExpenseCategories = aggregates.expenseCategories
    .slice(0, 3)
    .map((cat) => formatCategoryInsight(cat, aggregates.totalExpense));

  // Format top income categories (top 3)
  const topIncomeCategories = aggregates.incomeCategories
    .slice(0, 3)
    .map((cat) => formatCategoryInsight(cat, aggregates.totalIncome));

  // Build response
  const response: MonthlyInsightsResponse = {
    month: aggregates.month,
    summary: {
      totalIncome: aggregates.totalIncome,
      totalExpense: aggregates.totalExpense,
      netBalance: aggregates.totalIncome - aggregates.totalExpense,
      transactionCount: aggregates.transactionCount,
    },
    narrative,
    source: 'generated',
    highlights,
    topExpenseCategories,
    topIncomeCategories,
  };

  return response;
}
