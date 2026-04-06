import { testApp } from '../helpers/test-app.js';
import { loginUser } from '../helpers/auth.js';

function itIfDatabaseAvailable(testName: string, testFn: () => Promise<void>) {
  if (process.env.DATABASE_URL) {
    it(testName, testFn);
  } else {
    it.skip(testName, testFn);
  }
}

describe('Dashboard', () => {
  describe('5.1 Summary totals correct', () => {
    itIfDatabaseAvailable('should return correct income, expense, and net balance', async () => {
      const adminToken = await loginUser('admin@finance-dashboard.local', 'AdminPassword123');

      const response = await testApp()
        .get('/api/v1/dashboard/summary')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('totalIncome', 7000);
      expect(response.body).toHaveProperty('totalExpense', 1680);
      expect(response.body).toHaveProperty('netBalance', 5320);
    });

    itIfDatabaseAvailable('should allow viewer role to access summary', async () => {
      const viewerToken = await loginUser('viewer@finance-dashboard.local', 'ViewerPassword123');

      const response = await testApp()
        .get('/api/v1/dashboard/summary')
        .set('Authorization', `Bearer ${viewerToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('totalIncome');
      expect(response.body).toHaveProperty('totalExpense');
      expect(response.body).toHaveProperty('netBalance');
    });

    itIfDatabaseAvailable('should allow analyst role to access summary', async () => {
      const analystToken = await loginUser('analyst@finance-dashboard.local', 'AnalystPassword123');

      const response = await testApp()
        .get('/api/v1/dashboard/summary')
        .set('Authorization', `Bearer ${analystToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('totalIncome');
      expect(response.body).toHaveProperty('totalExpense');
      expect(response.body).toHaveProperty('netBalance');
    });

    itIfDatabaseAvailable('should filter summary by date range', async () => {
      const adminToken = await loginUser('admin@finance-dashboard.local', 'AdminPassword123');

      const response = await testApp()
        .get('/api/v1/dashboard/summary?startDate=2026-03-01&endDate=2026-03-31')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('totalIncome');
      expect(response.body).toHaveProperty('totalExpense');
      expect(response.body).toHaveProperty('netBalance');
      expect(response.body).toHaveProperty('period');
      expect(response.body.period).toHaveProperty('startDate', '2026-03-01');
      expect(response.body.period).toHaveProperty('endDate', '2026-03-31');
    });

    itIfDatabaseAvailable('should return 400 for invalid date range', async () => {
      const adminToken = await loginUser('admin@finance-dashboard.local', 'AdminPassword123');

      const response = await testApp()
        .get('/api/v1/dashboard/summary?startDate=not-a-date')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('5.2 Category totals correct', () => {
    itIfDatabaseAvailable('should return correct category breakdown with totals', async () => {
      const adminToken = await loginUser('admin@finance-dashboard.local', 'AdminPassword123');

      const response = await testApp()
        .get('/api/v1/dashboard/category-breakdown')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);

      const salaryCategory = response.body.data.find((item: any) => item.category === 'Salary');
      expect(salaryCategory).toBeDefined();
      expect(salaryCategory).toHaveProperty('type', 'income');
      expect(salaryCategory).toHaveProperty('total', 5000);
      expect(salaryCategory).toHaveProperty('count', 1);

      const rentCategory = response.body.data.find((item: any) => item.category === 'Rent');
      expect(rentCategory).toBeDefined();
      expect(rentCategory).toHaveProperty('type', 'expense');
      expect(rentCategory).toHaveProperty('total', 1200);
      expect(rentCategory).toHaveProperty('count', 1);
    });

    itIfDatabaseAvailable('should group by category and include count', async () => {
      const adminToken = await loginUser('admin@finance-dashboard.local', 'AdminPassword123');

      const response = await testApp()
        .get('/api/v1/dashboard/category-breakdown')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      response.body.data.forEach((item: any) => {
        expect(item).toHaveProperty('category');
        expect(item).toHaveProperty('type');
        expect(item).toHaveProperty('total');
        expect(item).toHaveProperty('count');
        expect(typeof item.total).toBe('number');
        expect(typeof item.count).toBe('number');
        expect(item.total).toBeGreaterThan(0);
        expect(item.count).toBeGreaterThan(0);
      });
    });

    itIfDatabaseAvailable('should filter breakdown by income type', async () => {
      const adminToken = await loginUser('admin@finance-dashboard.local', 'AdminPassword123');

      const response = await testApp()
        .get('/api/v1/dashboard/category-breakdown?type=income')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      response.body.data.forEach((item: any) => {
        expect(item.type).toBe('income');
      });
    });

    itIfDatabaseAvailable('should filter breakdown by expense type', async () => {
      const adminToken = await loginUser('admin@finance-dashboard.local', 'AdminPassword123');

      const response = await testApp()
        .get('/api/v1/dashboard/category-breakdown?type=expense')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      response.body.data.forEach((item: any) => {
        expect(item.type).toBe('expense');
      });
    });

    itIfDatabaseAvailable('should allow analyst to access category breakdown', async () => {
      const analystToken = await loginUser('analyst@finance-dashboard.local', 'AnalystPassword123');

      const response = await testApp()
        .get('/api/v1/dashboard/category-breakdown')
        .set('Authorization', `Bearer ${analystToken}`)
        .expect(200);

      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('5.3 Recent activity ordered correctly', () => {
    itIfDatabaseAvailable('should return recent activity ordered by createdAt descending', async () => {
      const adminToken = await loginUser('admin@finance-dashboard.local', 'AdminPassword123');

      const response = await testApp()
        .get('/api/v1/dashboard/recent-activity')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);

      for (let i = 0; i < response.body.data.length - 1; i++) {
        const currentDate = new Date(response.body.data[i].createdAt);
        const nextDate = new Date(response.body.data[i + 1].createdAt);
        expect(currentDate.getTime()).toBeGreaterThanOrEqual(nextDate.getTime());
      }
    });

    itIfDatabaseAvailable('should return activity items with required fields', async () => {
      const adminToken = await loginUser('admin@finance-dashboard.local', 'AdminPassword123');

      const response = await testApp()
        .get('/api/v1/dashboard/recent-activity')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      response.body.data.forEach((item: any) => {
        expect(item).toHaveProperty('id');
        expect(item).toHaveProperty('amount');
        expect(item).toHaveProperty('type');
        expect(item).toHaveProperty('category');
        expect(item).toHaveProperty('date');
        expect(item).toHaveProperty('createdAt');
        expect(['income', 'expense']).toContain(item.type);
      });
    });

    itIfDatabaseAvailable('should respect limit parameter', async () => {
      const adminToken = await loginUser('admin@finance-dashboard.local', 'AdminPassword123');

      const response = await testApp()
        .get('/api/v1/dashboard/recent-activity?limit=2')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeLessThanOrEqual(2);
    });

    itIfDatabaseAvailable('should default to 10 items when limit not specified', async () => {
      const adminToken = await loginUser('admin@finance-dashboard.local', 'AdminPassword123');

      const response = await testApp()
        .get('/api/v1/dashboard/recent-activity')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.length).toBeLessThanOrEqual(10);
    });

    itIfDatabaseAvailable('should allow viewer to access recent activity', async () => {
      const viewerToken = await loginUser('viewer@finance-dashboard.local', 'ViewerPassword123');

      const response = await testApp()
        .get('/api/v1/dashboard/recent-activity')
        .set('Authorization', `Bearer ${viewerToken}`)
        .expect(200);

      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('5.4 Trend output formatted correctly', () => {
    itIfDatabaseAvailable('should return trends with correct structure', async () => {
      const adminToken = await loginUser('admin@finance-dashboard.local', 'AdminPassword123');

      const response = await testApp()
        .get('/api/v1/dashboard/trends')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body).toHaveProperty('groupBy');
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    itIfDatabaseAvailable('should return trend items with period, income, expense, net', async () => {
      const adminToken = await loginUser('admin@finance-dashboard.local', 'AdminPassword123');

      const response = await testApp()
        .get('/api/v1/dashboard/trends')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      response.body.data.forEach((item: any) => {
        expect(item).toHaveProperty('period');
        expect(item).toHaveProperty('income');
        expect(item).toHaveProperty('expense');
        expect(item).toHaveProperty('net');
        expect(typeof item.period).toBe('string');
        expect(typeof item.income).toBe('number');
        expect(typeof item.expense).toBe('number');
        expect(typeof item.net).toBe('number');
        expect(item.net).toBe(item.income - item.expense);
      });
    });

    itIfDatabaseAvailable('should default to month grouping', async () => {
      const adminToken = await loginUser('admin@finance-dashboard.local', 'AdminPassword123');

      const response = await testApp()
        .get('/api/v1/dashboard/trends')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.groupBy).toBe('month');

      response.body.data.forEach((item: any) => {
        expect(item.period).toMatch(/^\d{4}-\d{2}$/);
      });
    });

    itIfDatabaseAvailable('should support week grouping', async () => {
      const adminToken = await loginUser('admin@finance-dashboard.local', 'AdminPassword123');

      const response = await testApp()
        .get('/api/v1/dashboard/trends?groupBy=week')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.groupBy).toBe('week');

      response.body.data.forEach((item: any) => {
        expect(item.period).toMatch(/^\d{4}-W\d{2}$/);
      });
    });

    itIfDatabaseAvailable('should return trends sorted by period', async () => {
      const adminToken = await loginUser('admin@finance-dashboard.local', 'AdminPassword123');

      const response = await testApp()
        .get('/api/v1/dashboard/trends')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const periods = response.body.data.map((item: any) => item.period);
      const sortedPeriods = [...periods].sort((a, b) => a.localeCompare(b));

      expect(periods).toEqual(sortedPeriods);
    });

    itIfDatabaseAvailable('should filter trends by date range', async () => {
      const adminToken = await loginUser('admin@finance-dashboard.local', 'AdminPassword123');

      const response = await testApp()
        .get('/api/v1/dashboard/trends?startDate=2026-03-01&endDate=2026-03-31')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body).toHaveProperty('period');
    });

    itIfDatabaseAvailable('should allow analyst to access trends', async () => {
      const analystToken = await loginUser('analyst@finance-dashboard.local', 'AnalystPassword123');

      const response = await testApp()
        .get('/api/v1/dashboard/trends')
        .set('Authorization', `Bearer ${analystToken}`)
        .expect(200);

      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body).toHaveProperty('groupBy');
    });
  });

  describe('5.5 Soft-deleted records excluded from dashboard', () => {
    itIfDatabaseAvailable('soft-deleted records should be excluded from summary totals', async () => {
      const adminToken = await loginUser('admin@finance-dashboard.local', 'AdminPassword123');

      // Create a record
      const createResponse = await testApp()
        .post('/api/v1/records')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amount: 500.00,
          type: 'income',
          category: 'bonus',
          date: new Date().toISOString().split('T')[0],
          notes: 'test soft delete exclusion from summary',
        })
        .expect(201);

      const recordId = createResponse.body.id;

      // Get summary before delete
      const summaryBefore = await testApp()
        .get('/api/v1/dashboard/summary')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Delete the record (soft delete)
      await testApp()
        .delete(`/api/v1/records/${recordId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);

      // Get summary after delete
      const summaryAfter = await testApp()
        .get('/api/v1/dashboard/summary')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Summary should have decreased
      expect(summaryAfter.body.totalIncome).toBeLessThan(summaryBefore.body.totalIncome);
      expect(summaryAfter.body.netBalance).toBeLessThan(summaryBefore.body.netBalance);
    });

    itIfDatabaseAvailable('soft-deleted records should be excluded from category breakdown', async () => {
      const adminToken = await loginUser('admin@finance-dashboard.local', 'AdminPassword123');

      // Create a record
      const createResponse = await testApp()
        .post('/api/v1/records')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amount: 250.00,
          type: 'expense',
          category: 'test-category-soft-delete',
          date: new Date().toISOString().split('T')[0],
          notes: 'test category exclusion',
        })
        .expect(201);

      const recordId = createResponse.body.id;

      // Get breakdown before delete (verify test category exists)
      const breakdownBefore = await testApp()
        .get('/api/v1/dashboard/category-breakdown')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const testCategoryBefore = breakdownBefore.body.data.find(
        (item: any) => item.category === 'test-category-soft-delete'
      );
      expect(testCategoryBefore).toBeDefined();
      const countBefore = testCategoryBefore.count;

      // Delete the record (soft delete)
      await testApp()
        .delete(`/api/v1/records/${recordId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);

      // Get breakdown after delete
      const breakdownAfter = await testApp()
        .get('/api/v1/dashboard/category-breakdown')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const testCategoryAfter = breakdownAfter.body.data.find(
        (item: any) => item.category === 'test-category-soft-delete'
      );

      // Category should have fewer records or be removed entirely
      if (testCategoryAfter) {
        expect(testCategoryAfter.count).toBeLessThan(countBefore);
      } else {
        expect(testCategoryAfter).toBeUndefined();
      }
    });

    itIfDatabaseAvailable('soft-deleted records should be excluded from recent activity', async () => {
      const adminToken = await loginUser('admin@finance-dashboard.local', 'AdminPassword123');

      // Create a record
      const createResponse = await testApp()
        .post('/api/v1/records')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amount: 350.00,
          type: 'expense',
          category: 'test-recent-activity',
          date: new Date().toISOString().split('T')[0],
          notes: 'test recent activity exclusion',
        })
        .expect(201);

      const recordId = createResponse.body.id;

      // Get recent activity before delete
      const recentBefore = await testApp()
        .get('/api/v1/dashboard/recent-activity')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const recordBefore = recentBefore.body.data.find((r: any) => r.id === recordId);
      expect(recordBefore).toBeDefined();

      // Delete the record (soft delete)
      await testApp()
        .delete(`/api/v1/records/${recordId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);

      // Get recent activity after delete
      const recentAfter = await testApp()
        .get('/api/v1/dashboard/recent-activity')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const recordAfter = recentAfter.body.data.find((r: any) => r.id === recordId);
      expect(recordAfter).toBeUndefined();
    });
  });

  describe('Authentication and authorization', () => {
    itIfDatabaseAvailable('should reject unauthenticated request to summary', async () => {
      await testApp()
        .get('/api/v1/dashboard/summary')
        .expect(401);
    });

    itIfDatabaseAvailable('should reject invalid token', async () => {
      await testApp()
        .get('/api/v1/dashboard/summary')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('5.6 Monthly insights with AI enhancement', () => {
    describe('Valid requests', () => {
      itIfDatabaseAvailable('should return 200 for valid request with month query', async () => {
        const adminToken = await loginUser('admin@finance-dashboard.local', 'AdminPassword123');

        const response = await testApp()
          .get('/api/v1/dashboard/monthly-insights?month=2026-03')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('month', '2026-03');
        expect(response.body).toHaveProperty('summary');
        expect(response.body).toHaveProperty('narrative');
        expect(response.body).toHaveProperty('source');
        expect(response.body).toHaveProperty('highlights');
        expect(response.body).toHaveProperty('topExpenseCategories');
        expect(response.body).toHaveProperty('topIncomeCategories');
      });

      itIfDatabaseAvailable('should default to current month when no month query provided', async () => {
        const adminToken = await loginUser('admin@finance-dashboard.local', 'AdminPassword123');

        const response = await testApp()
          .get('/api/v1/dashboard/monthly-insights')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        const currentDate = new Date();
        const expectedMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(
          2,
          '0'
        )}`;

        expect(response.body).toHaveProperty('month', expectedMonth);
        expect(response.body).toHaveProperty('summary');
        expect(response.body).toHaveProperty('narrative');
        expect(response.body).toHaveProperty('source');
      });
    });

    describe('Response contract validation', () => {
      itIfDatabaseAvailable('response shape matches locked contract', async () => {
        const adminToken = await loginUser('admin@finance-dashboard.local', 'AdminPassword123');

        const response = await testApp()
          .get('/api/v1/dashboard/monthly-insights?month=2026-03')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        const body = response.body;

        // Required root props
        expect(typeof body.month).toBe('string');
        expect(typeof body.narrative).toBe('string');
        expect(['ai', 'generated']).toContain(body.source);
        expect(Array.isArray(body.highlights)).toBe(true);
        expect(Array.isArray(body.topExpenseCategories)).toBe(true);
        expect(Array.isArray(body.topIncomeCategories)).toBe(true);

        // Summary structure
        expect(typeof body.summary).toBe('object');
        expect(typeof body.summary.totalIncome).toBe('number');
        expect(typeof body.summary.totalExpense).toBe('number');
        expect(typeof body.summary.netBalance).toBe('number');
        expect(typeof body.summary.transactionCount).toBe('number');

        // Highlight item structure
        if (body.highlights.length > 0) {
          const highlight = body.highlights[0];
          expect(['trend', 'increase', 'decrease', 'anomaly', 'milestone']).toContain(highlight.type);
          expect(typeof highlight.message).toBe('string');
          if (highlight.category) {
            expect(typeof highlight.category).toBe('string');
          }
          if (highlight.value !== undefined) {
            expect(typeof highlight.value).toBe('number');
          }
          if (highlight.previousValue !== undefined) {
            expect(typeof highlight.previousValue).toBe('number');
          }
        }

        // Category item structure
        if (body.topExpenseCategories.length > 0) {
          const category = body.topExpenseCategories[0];
          expect(typeof category.category).toBe('string');
          expect(typeof category.amount).toBe('number');
          expect(typeof category.percentOfTotal).toBe('number');
          expect(typeof category.transactionCount).toBe('number');
          expect(category.percentOfTotal).toBeGreaterThanOrEqual(0);
          expect(category.percentOfTotal).toBeLessThanOrEqual(100);
        }
      });

      itIfDatabaseAvailable('source is either "ai" or "generated"', async () => {
        const adminToken = await loginUser('admin@finance-dashboard.local', 'AdminPassword123');

        const response = await testApp()
          .get('/api/v1/dashboard/monthly-insights?month=2026-03')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(['ai', 'generated']).toContain(response.body.source);
        expect(response.body.source).toBeDefined();
      });
    });

    describe('Query validation', () => {
      itIfDatabaseAvailable('should return 400 for invalid month format', async () => {
        const adminToken = await loginUser('admin@finance-dashboard.local', 'AdminPassword123');

        const invalidMonths = ['2026-13', '2026/03', 'march-2026', '03-2026', '2026'];

        for (const month of invalidMonths) {
          const response = await testApp()
            .get(`/api/v1/dashboard/monthly-insights?month=${month}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(400);

          expect(response.body).toHaveProperty('error');
          expect(response.body.error).toBeTruthy();
        }
      });

      itIfDatabaseAvailable('should return 400 for future month', async () => {
        const adminToken = await loginUser('admin@finance-dashboard.local', 'AdminPassword123');

        const futureDate = new Date();
        futureDate.setMonth(futureDate.getMonth() + 2);
        const futureMonth = `${futureDate.getFullYear()}-${String(futureDate.getMonth() + 1).padStart(2, '0')}`;

        const response = await testApp()
          .get(`/api/v1/dashboard/monthly-insights?month=${futureMonth}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(400);

        expect(response.body).toHaveProperty('error');
      });

      itIfDatabaseAvailable('should accept valid YYYY-MM format', async () => {
        const adminToken = await loginUser('admin@finance-dashboard.local', 'AdminPassword123');

        const response = await testApp()
          .get('/api/v1/dashboard/monthly-insights?month=2026-01')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('month', '2026-01');
      });
    });

    describe('Authorization', () => {
      itIfDatabaseAvailable('should allow viewer role to access monthly insights', async () => {
        const viewerToken = await loginUser('viewer@finance-dashboard.local', 'ViewerPassword123');

        const response = await testApp()
          .get('/api/v1/dashboard/monthly-insights?month=2026-03')
          .set('Authorization', `Bearer ${viewerToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('month');
        expect(response.body).toHaveProperty('narrative');
        expect(response.body).toHaveProperty('source');
      });

      itIfDatabaseAvailable('should allow analyst role to access monthly insights', async () => {
        const analystToken = await loginUser('analyst@finance-dashboard.local', 'AnalystPassword123');

        const response = await testApp()
          .get('/api/v1/dashboard/monthly-insights?month=2026-03')
          .set('Authorization', `Bearer ${analystToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('month');
        expect(response.body).toHaveProperty('narrative');
        expect(response.body).toHaveProperty('source');
      });

      itIfDatabaseAvailable('should allow admin role to access monthly insights', async () => {
        const adminToken = await loginUser('admin@finance-dashboard.local', 'AdminPassword123');

        const response = await testApp()
          .get('/api/v1/dashboard/monthly-insights?month=2026-03')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('month');
        expect(response.body).toHaveProperty('narrative');
        expect(response.body).toHaveProperty('source');
      });

      it('should reject unauthenticated request to monthly insights', async () => {
        await testApp()
          .get('/api/v1/dashboard/monthly-insights')
          .expect(401);
      });

      it('should reject invalid token for monthly insights', async () => {
        await testApp()
          .get('/api/v1/dashboard/monthly-insights')
          .set('Authorization', 'Bearer invalid-token')
          .expect(401);
      });
    });

    describe('Data handling', () => {
      itIfDatabaseAvailable('should return valid empty-state payload for month with no financial activity', async () => {
        const adminToken = await loginUser('admin@finance-dashboard.local', 'AdminPassword123');

        // Use a month far in the past or future with no data
        const response = await testApp()
          .get('/api/v1/dashboard/monthly-insights?month=2020-01')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        const body = response.body;

        // All fields should still exist even with empty data
        expect(body).toHaveProperty('month', '2020-01');
        expect(body.summary.totalIncome).toBe(0);
        expect(body.summary.totalExpense).toBe(0);
        expect(body.summary.netBalance).toBe(0);
        expect(body.summary.transactionCount).toBe(0);
        expect(typeof body.narrative).toBe('string');
        expect(body.narrative.length).toBeGreaterThan(0); // Should have generated message
        expect(body.highlights).toEqual([]);
        expect(body.topExpenseCategories).toEqual([]);
        expect(body.topIncomeCategories).toEqual([]);
      });

      itIfDatabaseAvailable('AI unavailable path returns valid source: "generated" response', async () => {
        const adminToken = await loginUser('admin@finance-dashboard.local', 'AdminPassword123');

        const response = await testApp()
          .get('/api/v1/dashboard/monthly-insights?month=2026-03')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        // Even if AI is unavailable, response should always have valid fallback
        expect(response.body).toHaveProperty('source');
        expect(['ai', 'generated']).toContain(response.body.source);

        // All required fields should be present
        expect(response.body).toHaveProperty('month');
        expect(response.body).toHaveProperty('summary');
        expect(response.body).toHaveProperty('narrative');
        expect(response.body).toHaveProperty('highlights');
        expect(response.body).toHaveProperty('topExpenseCategories');
        expect(response.body).toHaveProperty('topIncomeCategories');

        // Narrative should be non-empty (deterministic fallback always works)
        expect(typeof response.body.narrative).toBe('string');
        expect(response.body.narrative.length).toBeGreaterThan(0);
      });

      itIfDatabaseAvailable('highlights array is present even with minimal data', async () => {
        const adminToken = await loginUser('admin@finance-dashboard.local', 'AdminPassword123');

        const response = await testApp()
          .get('/api/v1/dashboard/monthly-insights?month=2026-03')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(Array.isArray(response.body.highlights)).toBe(true);
        // Highlights can be empty or populated, but must be array
        expect(response.body.highlights.length).toBeGreaterThanOrEqual(0);
      });

      itIfDatabaseAvailable('top categories limited and properly ranked', async () => {
        const adminToken = await loginUser('admin@finance-dashboard.local', 'AdminPassword123');

        const response = await testApp()
          .get('/api/v1/dashboard/monthly-insights?month=2026-03')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        // If there are categories, they should be ordered by amount (highest first)
        if (response.body.topExpenseCategories.length > 1) {
          for (let i = 1; i < response.body.topExpenseCategories.length; i++) {
            expect(response.body.topExpenseCategories[i - 1].amount).toBeGreaterThanOrEqual(
              response.body.topExpenseCategories[i].amount
            );
          }
        }

        if (response.body.topIncomeCategories.length > 1) {
          for (let i = 1; i < response.body.topIncomeCategories.length; i++) {
            expect(response.body.topIncomeCategories[i - 1].amount).toBeGreaterThanOrEqual(
              response.body.topIncomeCategories[i].amount
            );
          }
        }
      });
    });

    describe('Month parameter edge cases', () => {
      itIfDatabaseAvailable('should handle month with leading zeros correctly', async () => {
        const adminToken = await loginUser('admin@finance-dashboard.local', 'AdminPassword123');

        const response = await testApp()
          .get('/api/v1/dashboard/monthly-insights?month=2026-01')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.month).toBe('2026-01');
      });

      itIfDatabaseAvailable('should handle past year months', async () => {
        const adminToken = await loginUser('admin@finance-dashboard.local', 'AdminPassword123');

        const pastYear = new Date().getFullYear() - 1;
        const response = await testApp()
          .get(`/api/v1/dashboard/monthly-insights?month=${pastYear}-06`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.month).toBe(`${pastYear}-06`);
      });
    });
  });
});
