import { Router, Request, Response } from 'express';
import { sendList, sendAggregation, asyncHandler } from '../../shared/utils/index.js';
import { sendValidationError } from '../../shared/errors/api-error-response.js';
import {
  attachAuthenticatedUser,
  requireActiveUser,
  requirePermission,
  dashboardReadRateLimiter,
} from '../../shared/middleware/index.js';
import { PermissionAction } from '../../shared/access-control/permission-action.js';
import * as dashboardService from './dashboard.service.js';
import type { MonthlyInsightsResponse } from './dashboard.types.js';
import {
  validateQuery,
  dashboardSummarySchema,
  dashboardCategoryBreakdownSchema,
  dashboardRecentActivitySchema,
  dashboardTrendsSchema,
  dashboardMonthlyInsightsSchema,
} from '../../shared/validation/index.js';

interface SummaryQuery {
  startDate?: string;
  endDate?: string;
}

interface CategoryBreakdownQuery {
  startDate?: string;
  endDate?: string;
  type?: string;
}

interface RecentActivityQuery {
  limit?: string;
}

interface TrendsQuery {
  startDate?: string;
  endDate?: string;
  groupBy?: string;
}

interface SummaryResponse {
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  period?: {
    startDate: string | null;
    endDate: string | null;
  };
}

interface CategoryBreakdownItem {
  category: string;
  type: string;
  total: number;
  count: number;
}

interface CategoryBreakdownResponse {
  data: CategoryBreakdownItem[];
  period?: {
    startDate: string | null;
    endDate: string | null;
  };
}

interface TrendItem {
  period: string;
  income: number;
  expense: number;
  net: number;
}

interface TrendsResponse {
  data: TrendItem[];
  groupBy: string;
  period?: {
    startDate: string | null;
    endDate: string | null;
  };
}

function parseDate(dateString: string): Date | null {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return null;
  }
  return date;
}

const router = Router();

router.use(dashboardReadRateLimiter);

router.get(
  '/summary',
  attachAuthenticatedUser,
  requireActiveUser,
  requirePermission(PermissionAction.dashboard.summary),
  asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as Record<string, unknown>;

    const result = validateQuery(query, dashboardSummarySchema);

    if (!result.valid) {
      return sendValidationError(res, 'Request validation failed', result.errors);
    }

    const startDate = result.data?.startDate ? parseDate(result.data.startDate as string) : undefined;
    const endDate = result.data?.endDate ? parseDate(result.data.endDate as string) : undefined;

    if (startDate && endDate && startDate > endDate) {
      return sendValidationError(res, 'Request validation failed', [
        { field: 'startDate', issue: 'must not be after endDate' },
      ]);
    }

    const summary = await dashboardService.getSummary({
      startDate: startDate ?? undefined,
      endDate: endDate ?? undefined,
    });

    const response: SummaryResponse = {
      totalIncome: summary.totalIncome,
      totalExpense: summary.totalExpense,
      netBalance: summary.netBalance,
    };

    if (startDate || endDate) {
      response.period = {
        startDate: startDate ? startDate.toISOString().split('T')[0] : null,
        endDate: endDate ? endDate.toISOString().split('T')[0] : null,
      };
    }

    return sendAggregation(res, response, 200);
  })
);

router.get(
  '/category-breakdown',
  attachAuthenticatedUser,
  requireActiveUser,
  requirePermission(PermissionAction.dashboard.categoryBreakdown),
  asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as Record<string, unknown>;

    const result = validateQuery(query, dashboardCategoryBreakdownSchema);

    if (!result.valid) {
      return sendValidationError(res, 'Request validation failed', result.errors);
    }

    const startDate = result.data?.startDate ? parseDate(result.data.startDate as string) : undefined;
    const endDate = result.data?.endDate ? parseDate(result.data.endDate as string) : undefined;

    if (startDate && endDate && startDate > endDate) {
      return sendValidationError(res, 'Request validation failed', [
        { field: 'startDate', issue: 'must not be after endDate' },
      ]);
    }

    const typeFilter = result.data?.type;

    const breakdown = await dashboardService.getCategoryBreakdown({
      startDate: startDate ?? undefined,
      endDate: endDate ?? undefined,
      type: typeFilter as string | undefined,
    });

    const response: CategoryBreakdownResponse = {
      data: breakdown.items,
    };

    if (startDate || endDate) {
      response.period = {
        startDate: startDate ? startDate.toISOString().split('T')[0] : null,
        endDate: endDate ? endDate.toISOString().split('T')[0] : null,
      };
    }

    return sendAggregation(res, response, 200);
  })
);

router.get(
  '/recent-activity',
  attachAuthenticatedUser,
  requireActiveUser,
  requirePermission(PermissionAction.dashboard.recentActivity),
  asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as Record<string, unknown>;

    const result = validateQuery(query, dashboardRecentActivitySchema);

    if (!result.valid) {
      return sendValidationError(res, 'Request validation failed', result.errors);
    }

    let limit = 10;
    if (result.data?.limit) {
      const parsedLimit = parseInt(result.data.limit as string, 10);
      if (!isNaN(parsedLimit)) {
        limit = parsedLimit;
      }
    }

    const recentActivity = await dashboardService.getRecentActivity({
      limit,
    });

    return sendList(res, recentActivity.items, 200);
  })
);

router.get(
  '/trends',
  attachAuthenticatedUser,
  requireActiveUser,
  requirePermission(PermissionAction.dashboard.trends),
  asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as Record<string, unknown>;

    const result = validateQuery(query, dashboardTrendsSchema);

    if (!result.valid) {
      return sendValidationError(res, 'Request validation failed', result.errors);
    }

    const groupBy = (result.data?.groupBy as string) || 'month';
    const startDate = result.data?.startDate ? parseDate(result.data.startDate as string) : undefined;
    const endDate = result.data?.endDate ? parseDate(result.data.endDate as string) : undefined;

    if (startDate && endDate && startDate > endDate) {
      return sendValidationError(res, 'Request validation failed', [
        { field: 'startDate', issue: 'must not be after endDate' },
      ]);
    }

    const trends = await dashboardService.getTrends({
      startDate: startDate ?? undefined,
      endDate: endDate ?? undefined,
      groupBy: groupBy ?? undefined,
    });

    const response: TrendsResponse = {
      data: trends.items,
      groupBy: trends.groupBy,
    };

    if (startDate || endDate) {
      response.period = {
        startDate: startDate ? startDate.toISOString().split('T')[0] : null,
        endDate: endDate ? endDate.toISOString().split('T')[0] : null,
      };
    }

    return sendAggregation(res, response, 200);
  })
);

router.get(
  '/monthly-insights',
  attachAuthenticatedUser,
  requireActiveUser,
  requirePermission(PermissionAction.dashboard.monthlyInsights),
  asyncHandler(async (req: Request, res: Response) => {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
    const query = req.query as Record<string, unknown>;

    const result = validateQuery(query, dashboardMonthlyInsightsSchema);

    if (!result.valid) {
      return sendValidationError(res, 'Request validation failed', result.errors);
    }

    const month = result.data?.month as string | undefined;

    const insights = await dashboardService.getMonthlyInsights(month);

    const response: MonthlyInsightsResponse = insights;

    return sendAggregation(res, response, 200);
  })
);

export default router;
