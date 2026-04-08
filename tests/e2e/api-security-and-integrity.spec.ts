import { test, expect } from '@playwright/test';
import { apiUrl, appConfig } from '../support/env';
import { bearer, expectPublicUserShape, loginViaApi, readJson } from '../support/api';

function numericTotal(items: Array<{ total: number }>) {
  return items.reduce((sum, item) => sum + item.total, 0);
}

function expectClose(actual: number, expected: number, delta = 0.01) {
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(delta);
}

test.describe('Production API security and Supabase-backed integrity', () => {
  test('exposes health, CORS, and security headers', async ({ request }) => {
    const response = await request.get(apiUrl('/health/'), {
      headers: {
        Origin: appConfig.frontendBaseURL,
      },
    });

    expect(response.ok()).toBeTruthy();
    expect(response.headers()['access-control-allow-origin']).toBe(appConfig.frontendBaseURL);
    expect(response.headers()['content-security-policy']).toContain("default-src 'self'");
    expect(response.headers()['x-content-type-options']).toBe('nosniff');
    expect(response.headers()['x-frame-options']).toBeTruthy();
    expect(response.headers()['referrer-policy']).toBeTruthy();

    const body = await readJson<{
      status: string;
      service: string;
      db: string;
      timestamp: string;
    }>(response);

    expect(body.status).toBe('ok');
    expect(body.service).toContain('finance-dashboard');
    expect(body.db).toBe('connected');
    expect(body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  test('sanitizes auth responses and rejects missing or invalid tokens', async ({ request }) => {
    const viewerAuth = await loginViaApi(request, 'viewer');
    expectPublicUserShape(viewerAuth.user as unknown as Record<string, unknown>);

    const meResponse = await request.get(apiUrl('/api/v1/auth/me'), {
      headers: bearer(viewerAuth.token),
    });
    expect(meResponse.ok()).toBeTruthy();

    const me = await readJson<Record<string, unknown>>(meResponse);
    expectPublicUserShape(me);

    const missingToken = await request.get(apiUrl('/api/v1/auth/me'));
    expect(missingToken.status()).toBe(401);
    await expect(readJson<{ message: string }>(missingToken)).resolves.toMatchObject({
      message: expect.stringMatching(/authentication/i),
    });

    const invalidToken = await request.get(apiUrl('/api/v1/auth/me'), {
      headers: bearer('definitely-not-a-valid-token'),
    });
    expect(invalidToken.status()).toBe(401);
    await expect(readJson<{ message: string }>(invalidToken)).resolves.toMatchObject({
      message: expect.stringMatching(/invalid|expired/i),
    });
  });

  test('returns differentiated auth failures without leaking sensitive fields', async ({ request }) => {
    test.skip(
      !appConfig.enableRateLimitChecks,
      'Skipped by default so monitoring does not consume the production login failure budget.'
    );

    const unknownUser = await request.post(apiUrl('/api/v1/auth/login'), {
      data: {
        email: 'nobody+playwright@finance-dashboard.local',
        password: 'TotallyInvalid123',
      },
    });
    expect(unknownUser.status()).toBe(401);
    await expect(readJson<{ message: string }>(unknownUser)).resolves.toMatchObject({
      message: expect.stringMatching(/sign up|not found|invalid email or password/i),
    });

    const badPassword = await request.post(apiUrl('/api/v1/auth/login'), {
      data: {
        email: 'viewer@finance-dashboard.local',
        password: 'WrongPassword123',
      },
    });
    expect(badPassword.status()).toBe(401);
    await expect(readJson<{ message: string }>(badPassword)).resolves.toMatchObject({
      message: expect.stringMatching(/password|invalid email or password/i),
    });

    const inactiveUser = await request.post(apiUrl('/api/v1/auth/login'), {
      data: {
        email: 'inactive@finance-dashboard.local',
        password: 'InactivePassword123',
      },
    });
    expect(inactiveUser.status()).toBe(401);
    await expect(readJson<{ message: string }>(inactiveUser)).resolves.toMatchObject({
      message: expect.stringMatching(/inactive/i),
    });
  });

  test('enforces role-based access control across viewer, analyst, and admin', async ({
    request,
  }) => {
    const viewer = await loginViaApi(request, 'viewer');
    const analyst = await loginViaApi(request, 'analyst');
    const admin = await loginViaApi(request, 'admin');

    const viewerDashboard = await request.get(apiUrl('/api/v1/dashboard/summary'), {
      headers: bearer(viewer.token),
    });
    expect(viewerDashboard.ok()).toBeTruthy();

    const viewerRecords = await request.get(apiUrl('/api/v1/records'), {
      headers: bearer(viewer.token),
    });
    expect(viewerRecords.status()).toBe(403);

    const viewerUsers = await request.get(apiUrl('/api/v1/users'), {
      headers: bearer(viewer.token),
    });
    expect(viewerUsers.status()).toBe(403);

    const analystRecords = await request.get(apiUrl('/api/v1/records?limit=2'), {
      headers: bearer(analyst.token),
    });
    expect(analystRecords.ok()).toBeTruthy();

    const analystUsers = await request.get(apiUrl('/api/v1/users'), {
      headers: bearer(analyst.token),
    });
    expect(analystUsers.status()).toBe(403);

    const analystCreateRecord = await request.post(apiUrl('/api/v1/records'), {
      headers: bearer(analyst.token),
      data: {
        amount: 10,
        type: 'expense',
        category: 'Should Not Write',
        date: new Date().toISOString().split('T')[0],
        notes: 'Permission check only',
      },
    });
    expect(analystCreateRecord.status()).toBe(403);

    const adminUsers = await request.get(apiUrl('/api/v1/users'), {
      headers: bearer(admin.token),
    });
    expect(adminUsers.ok()).toBeTruthy();

    const adminUsersBody = await readJson<{
      data: Array<Record<string, unknown>>;
      count: number;
    }>(adminUsers);
    expect(adminUsersBody.count).toBeGreaterThanOrEqual(1);
    adminUsersBody.data.forEach((user) => expectPublicUserShape(user));
  });

  test('keeps dashboard, records, monthly insights, and category suggestions internally consistent', async ({
    request,
  }) => {
    const analyst = await loginViaApi(request, 'analyst');
    const headers = bearer(analyst.token);

    const summaryResponse = await request.get(apiUrl('/api/v1/dashboard/summary'), {
      headers,
    });
    expect(summaryResponse.ok()).toBeTruthy();
    const summary = await readJson<{
      totalIncome: number;
      totalExpense: number;
      netBalance: number;
    }>(summaryResponse);
    expect(summary.netBalance).toBe(summary.totalIncome - summary.totalExpense);

    const incomeBreakdownResponse = await request.get(
      apiUrl('/api/v1/dashboard/category-breakdown?type=income'),
      { headers }
    );
    expect(incomeBreakdownResponse.ok()).toBeTruthy();
    const incomeBreakdown = await readJson<{ data: Array<{ total: number }> }>(
      incomeBreakdownResponse
    );
    expectClose(numericTotal(incomeBreakdown.data), summary.totalIncome);

    const expenseBreakdownResponse = await request.get(
      apiUrl('/api/v1/dashboard/category-breakdown?type=expense'),
      { headers }
    );
    expect(expenseBreakdownResponse.ok()).toBeTruthy();
    const expenseBreakdown = await readJson<{ data: Array<{ total: number }> }>(
      expenseBreakdownResponse
    );
    expectClose(numericTotal(expenseBreakdown.data), summary.totalExpense);

    const recordsResponse = await request.get(apiUrl('/api/v1/records?limit=5'), {
      headers,
    });
    expect(recordsResponse.ok()).toBeTruthy();
    const records = await readJson<{
      data: Array<Record<string, unknown>>;
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>(recordsResponse);

    expect(records.pagination.total).toBeGreaterThanOrEqual(records.data.length);
    expect(records.pagination.limit).toBe(5);
    expect(records.data.length).toBeGreaterThan(0);

    records.data.forEach((record) => {
      expect(record).toMatchObject({
        id: expect.any(String),
        amount: expect.any(Number),
        type: expect.stringMatching(/income|expense/),
        category: expect.any(String),
        date: expect.any(String),
      });
      expect(record).not.toHaveProperty('deletedAt');
    });

    const firstCategory = records.data[0]?.category as string | undefined;
    if (firstCategory) {
      const filteredResponse = await request.get(
        apiUrl(`/api/v1/records?category=${encodeURIComponent(firstCategory)}&limit=5`),
        { headers }
      );
      expect(filteredResponse.ok()).toBeTruthy();
      const filtered = await readJson<{ data: Array<{ category: string }> }>(filteredResponse);
      filtered.data.forEach((record) => expect(record.category).toBe(firstCategory));
    }

    const recentResponse = await request.get(apiUrl('/api/v1/dashboard/recent-activity?limit=5'), {
      headers,
    });
    expect(recentResponse.ok()).toBeTruthy();
    const recent = await readJson<{
      data: Array<{ id: string; type: string; amount: number }>;
      count: number;
    }>(recentResponse);
    expect(recent.data.length).toBeLessThanOrEqual(5);
    expect(new Set(recent.data.map((item) => item.id)).size).toBe(recent.data.length);
    recent.data.forEach((item) => {
      expect(item.type).toMatch(/income|expense/);
      expect(item.amount).toEqual(expect.any(Number));
    });

    const trendsResponse = await request.get(apiUrl('/api/v1/dashboard/trends?groupBy=month'), {
      headers,
    });
    expect(trendsResponse.ok()).toBeTruthy();
    const trends = await readJson<{
      data: Array<{ period: string; income: number; expense: number; net: number }>;
      groupBy: string;
    }>(trendsResponse);
    expect(trends.groupBy).toBe('month');
    trends.data.forEach((item) => {
      expect(item.period).toMatch(/^\d{4}-\d{2}/);
      expect(item.net).toBe(item.income - item.expense);
    });

    const monthlyResponse = await request.get(apiUrl('/api/v1/dashboard/monthly-insights'), {
      headers,
    });
    expect(monthlyResponse.ok()).toBeTruthy();
    const monthly = await readJson<{
      month: string;
      narrative: string;
      source: string;
      highlights: unknown[];
      summary: { transactionCount: number };
      topExpenseCategories: unknown[];
      topIncomeCategories: unknown[];
    }>(monthlyResponse);
    expect(monthly.month).toMatch(/^\d{4}-\d{2}$/);
    expect(monthly.narrative.length).toBeGreaterThan(10);
    expect(monthly.source).toMatch(/ai|generated/);
    expect(monthly.summary.transactionCount).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(monthly.highlights)).toBeTruthy();
    expect(Array.isArray(monthly.topExpenseCategories)).toBeTruthy();
    expect(Array.isArray(monthly.topIncomeCategories)).toBeTruthy();

    const suggestionResponse = await request.post(apiUrl('/api/v1/records/suggest-category'), {
      headers,
      data: {
        notes: 'Weekly grocery market run',
        type: 'expense',
        amount: 64.2,
      },
    });
    expect(suggestionResponse.ok()).toBeTruthy();
    const suggestion = await readJson<{
      suggestedCategory: string | null;
      alternatives: string[];
      confidence: string;
      source: string;
    }>(suggestionResponse);
    expect(suggestion.confidence).toMatch(/high|medium|low/);
    expect(suggestion.source).toMatch(/ai|fallback/);
    expect(Array.isArray(suggestion.alternatives)).toBeTruthy();
    expect(suggestion.alternatives.length).toBeLessThanOrEqual(3);
    if (suggestion.suggestedCategory !== null) {
      expect(suggestion.suggestedCategory.length).toBeGreaterThan(0);
    }
  });
});
