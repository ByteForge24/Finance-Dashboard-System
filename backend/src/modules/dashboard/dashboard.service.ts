import { Prisma } from '@prisma/client';
import prisma from '../../config/prisma.js';
import { startOfDay, endOfDay } from '../../shared/utils/date.js';
import { generateMonthlyInsights } from './insights-generator.service.js';
import { enhanceMonthlyInsightsNarrative } from './ai-insights-generator.service.js';
import type { MonthlyInsightsResponse } from './dashboard.types.js';

export interface DashboardSummaryInput {
  startDate?: Date;
  endDate?: Date;
}

export interface DashboardSummaryOutput {
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
}

export async function getSummary(input: DashboardSummaryInput): Promise<DashboardSummaryOutput> {
  const where: Prisma.FinancialRecordWhereInput = {
    deletedAt: null,
  };

  if (input.startDate || input.endDate) {
    where.date = {};
    if (input.startDate) {
      where.date.gte = startOfDay(input.startDate);
    }
    if (input.endDate) {
      where.date.lte = endOfDay(input.endDate);
    }
  }

  const incomeResult = await prisma.financialRecord.aggregate({
    where: {
      ...where,
      type: 'INCOME',
    },
    _sum: {
      amount: true,
    },
  });

  const expenseResult = await prisma.financialRecord.aggregate({
    where: {
      ...where,
      type: 'EXPENSE',
    },
    _sum: {
      amount: true,
    },
  });

  const totalIncome = Number(incomeResult._sum.amount ?? 0);
  const totalExpense = Number(expenseResult._sum.amount ?? 0);
  const netBalance = totalIncome - totalExpense;

  return {
    totalIncome,
    totalExpense,
    netBalance,
  };
}

export interface CategoryBreakdownItem {
  category: string;
  type: string;
  total: number;
  count: number;
}

export interface DashboardCategoryBreakdownInput {
  startDate?: Date;
  endDate?: Date;
  type?: string;
}

export interface DashboardCategoryBreakdownOutput {
  items: CategoryBreakdownItem[];
}

export async function getCategoryBreakdown(
  input: DashboardCategoryBreakdownInput
): Promise<DashboardCategoryBreakdownOutput> {
  const where: Prisma.FinancialRecordWhereInput = {
    deletedAt: null,
  };

  if (input.startDate || input.endDate) {
    where.date = {};
    if (input.startDate) {
      where.date.gte = startOfDay(input.startDate);
    }
    if (input.endDate) {
      where.date.lte = endOfDay(input.endDate);
    }
  }

  if (input.type) {
    where.type = input.type === 'income' ? 'INCOME' : 'EXPENSE';
  }

  // Database-level aggregation via Prisma groupBy — no records loaded into memory
  const grouped = await prisma.financialRecord.groupBy({
    by: ['category', 'type'],
    where,
    _sum: { amount: true },
    _count: true,
    orderBy: { _sum: { amount: 'desc' } },
  });

  const items: CategoryBreakdownItem[] = grouped.map((row) => ({
    category: row.category,
    type: row.type === 'INCOME' ? 'income' : 'expense',
    total: Number(row._sum.amount ?? 0),
    count: row._count,
  }));

  return {
    items,
  };
}

export interface RecentActivityItem {
  id: string;
  amount: number;
  type: string;
  category: string;
  date: string;
  notes: string | null;
  createdAt: string;
}

export interface DashboardRecentActivityInput {
  limit?: number;
}

export interface DashboardRecentActivityOutput {
  items: RecentActivityItem[];
}

export async function getRecentActivity(
  input: DashboardRecentActivityInput
): Promise<DashboardRecentActivityOutput> {
  const limit = input.limit ?? 10;

  const records = await prisma.financialRecord.findMany({
    where: {
      deletedAt: null,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
    select: {
      id: true,
      amount: true,
      type: true,
      category: true,
      date: true,
      notes: true,
      createdAt: true,
    },
  });

  const items = records.map((record) => ({
    id: record.id,
    amount: Number(record.amount),
    type: record.type === 'INCOME' ? 'income' : 'expense',
    category: record.category,
    date: record.date.toISOString().split('T')[0],
    notes: record.notes,
    createdAt: record.createdAt.toISOString(),
  }));

  return {
    items,
  };
}

function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

function formatMonth(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function formatWeek(date: Date): string {
  const year = date.getFullYear();
  const start = getStartOfWeek(new Date(date));
  const diffTime = Math.abs(date.getTime() - start.getTime());
  const diffWeeks = Math.ceil((diffTime / (1000 * 60 * 60 * 24)) / 7);
  const week = String(diffWeeks).padStart(2, '0');
  return `${year}-W${week}`;
}

export interface TrendItem {
  period: string;
  income: number;
  expense: number;
  net: number;
}

export interface DashboardTrendsInput {
  startDate?: Date;
  endDate?: Date;
  groupBy?: string;
}

export interface DashboardTrendsOutput {
  items: TrendItem[];
  groupBy: string;
}

export async function getTrends(
  input: DashboardTrendsInput
): Promise<DashboardTrendsOutput> {
  const groupBy = input.groupBy ?? 'month';
  const where: Prisma.FinancialRecordWhereInput = {
    deletedAt: null,
  };

  if (input.startDate || input.endDate) {
    where.date = {};
    if (input.startDate) {
      where.date.gte = startOfDay(input.startDate);
    }
    if (input.endDate) {
      where.date.lte = endOfDay(input.endDate);
    }
  }

  // Database-level aggregation via raw SQL with DATE_TRUNC
  // This avoids loading all records into memory.
  const truncFn = groupBy === 'week' ? 'week' : 'month';

  // Build WHERE clause fragments for raw SQL
  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  // Always exclude soft-deleted records
  conditions.push('"deletedAt" IS NULL');

  if (input.startDate) {
    conditions.push(`"date" >= $${paramIndex}`);
    params.push(startOfDay(input.startDate));
    paramIndex++;
  }
  if (input.endDate) {
    conditions.push(`"date" <= $${paramIndex}`);
    params.push(endOfDay(input.endDate));
    paramIndex++;
  }

  const whereSQL = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  interface TrendRow {
    period: Date;
    type: string;
    total: number | null;
  }

  const rows = await prisma.$queryRawUnsafe<TrendRow[]>(
    `SELECT DATE_TRUNC('${truncFn}', "date") AS period,
            "type",
            SUM("amount") AS total
     FROM "FinancialRecord"
     ${whereSQL}
     GROUP BY period, "type"
     ORDER BY period ASC`,
    ...params
  );

  // Merge income/expense rows into TrendItem per period
  const trendMap = new Map<string, TrendItem>();

  for (const row of rows) {
    const periodKey = groupBy === 'week'
      ? formatWeek(new Date(row.period))
      : formatMonth(new Date(row.period));

    const existing = trendMap.get(periodKey) ?? { period: periodKey, income: 0, expense: 0, net: 0 };

    if (row.type === 'INCOME') {
      existing.income = Number(row.total ?? 0);
    } else {
      existing.expense = Number(row.total ?? 0);
    }
    existing.net = existing.income - existing.expense;
    trendMap.set(periodKey, existing);
  }

  const items = Array.from(trendMap.values()).sort((a, b) => a.period.localeCompare(b.period));

  return {
    items,
    groupBy,
  };
}

/**
 * Get monthly spending insights with deterministic generation and optional AI enhancement
 *
 * Orchestrates:
 * 1. Phase 3 deterministic generator (generateMonthlyInsights)
 * 2. Phase 4 optional AI narrative enhancer (enhanceMonthlyInsightsNarrative)
 *
 * The AI enhancement layer is optional and never breaks the response:
 * - If AI is configured and succeeds, narrative is AI-enhanced (source: 'ai')
 * - If AI is not configured or fails, deterministic narrative is used (source: 'generated')
 * - Either way, a complete valid response is returned
 *
 * @param month Optional month in YYYY-MM format. Defaults to current month.
 * @returns Complete monthly insights response with all highlights and categories
 */
export async function getMonthlyInsights(month?: string): Promise<MonthlyInsightsResponse> {
  // Phase 3: Generate deterministic insights
  const insights = await generateMonthlyInsights(month);

  // Phase 4: Optionally enhance with AI (graceful fallback if unavailable)
  const enhanced = await enhanceMonthlyInsightsNarrative(insights);

  return enhanced;
}
