import { SchemaDefinition, CommonRules, ValidationRule } from './validate-request.js';

/**
 * Validate month format (YYYY-MM) and reject future months
 */
function monthFormatAndNotFuture(): ValidationRule {
  return {
    validate: (v) => {
      if (typeof v !== 'string') return false;

      // Check format: YYYY-MM
      const match = v.match(/^(\d{4})-(\d{2})$/);
      if (!match) return false;

      const year = parseInt(match[1], 10);
      const month = parseInt(match[2], 10);

      // Validate month range
      if (month < 1 || month > 12) return false;
      if (year < 1900) return false;

      // Check if month is in the future
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;

      // Reject if year is in the future
      if (year > currentYear) return false;

      // Reject if same year but month is in the future
      if (year === currentYear && month > currentMonth) return false;

      return true;
    },
    message: 'must be in YYYY-MM format and not in the future',
  };
}

export const dashboardMonthlyInsightsSchema: SchemaDefinition = {
  month: {
    optional: true,
    rules: [monthFormatAndNotFuture()],
  },
};

export const dashboardSummarySchema: SchemaDefinition = {
  startDate: {
    optional: true,
    rules: [CommonRules.dateString()],
  },
  endDate: {
    optional: true,
    rules: [CommonRules.dateString()],
  },
};

export const dashboardCategoryBreakdownSchema: SchemaDefinition = {
  startDate: {
    optional: true,
    rules: [CommonRules.dateString()],
  },
  endDate: {
    optional: true,
    rules: [CommonRules.dateString()],
  },
  type: {
    optional: true,
    rules: [CommonRules.enum(['income', 'expense'])],
  },
};

export const dashboardRecentActivitySchema: SchemaDefinition = {
  limit: {
    optional: true,
    rules: [
      {
        validate: (v) => {
          if (typeof v === 'string') {
            const n = parseInt(v, 10);
            return !isNaN(n) && n >= 1 && n <= 100;
          }
          return typeof v === 'number' && v >= 1 && v <= 100;
        },
        message: 'must be a number between 1 and 100',
      },
    ],
  },
};

export const dashboardTrendsSchema: SchemaDefinition = {
  startDate: {
    optional: true,
    rules: [CommonRules.dateString()],
  },
  endDate: {
    optional: true,
    rules: [CommonRules.dateString()],
  },
  groupBy: {
    optional: true,
    rules: [CommonRules.enum(['month', 'week'])],
  },
};
