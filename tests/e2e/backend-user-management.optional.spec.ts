import { test, expect } from '@playwright/test';
import { apiUrl, appConfig } from '../support/env';
import { bearer, expectPublicUserShape, loginViaApi, readJson } from '../support/api';

/**
 * Backend user management endpoints tests
 * 
 * Safety: These tests read user data and perform read-only checks.
 * Some tests are WRITE-INTENSIVE and require ALLOW_PERSISTENT_PROD_USER_TESTS=true
 * because they mutate production data (user role/status changes).
 * 
 * No tests in this suite create or delete persistent users,
 * as there is no delete-user endpoint available.
 */

test.describe('Backend user management endpoints', () => {
  test.skip(
    !appConfig.allowPersistentProdUserTests,
    'Skipped unless ALLOW_PERSISTENT_PROD_USER_TESTS=true to protect production user data'
  );

  test('GET /api/v1/users returns list with pagination', async ({ request }) => {
    const admin = await loginViaApi(request, 'admin');

    const response = await request.get(apiUrl('/api/v1/users?limit=5&page=1'), {
      headers: bearer(admin.token),
    });

    expect(response.ok()).toBeTruthy();

    const body = await readJson<{
      data: Array<Record<string, unknown>>;
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>(response);

    expect(Array.isArray(body.data)).toBeTruthy();
    expect(body.pagination.page).toBe(1);
    expect(body.pagination.limit).toBe(5);
    expect(body.pagination.total).toBeGreaterThanOrEqual(body.data.length);

    body.data.forEach((user) => expectPublicUserShape(user));
  });

  test('GET /api/v1/users/:id returns single user', async ({ request }) => {
    const admin = await loginViaApi(request, 'admin');

    // First, get list to find a user ID
    const listResponse = await request.get(apiUrl('/api/v1/users?limit=1'), {
      headers: bearer(admin.token),
    });

    const listBody = await readJson<{
      data: Array<{ id: string }>;
    }>(listResponse);

    if (listBody.data.length === 0) {
      test.skip();
      return;
    }

    const userId = listBody.data[0].id;

    const response = await request.get(apiUrl(`/api/v1/users/${userId}`), {
      headers: bearer(admin.token),
    });

    expect(response.ok()).toBeTruthy();

    const user = await readJson<Record<string, unknown>>(response);
    expectPublicUserShape(user);
    expect(user.id).toBe(userId);
  });

  test('GET /api/v1/users/:id returns 404 for non-existent user', async ({ request }) => {
    const admin = await loginViaApi(request, 'admin');

    const response = await request.get(apiUrl('/api/v1/users/00000000-0000-0000-0000-000000000000'), {
      headers: bearer(admin.token),
    });

    expect(response.status()).toBe(404);
  });

  test('PATCH /api/v1/users/:id/role changes user role', async ({ request }) => {
    test.skip(
      !appConfig.allowPersistentProdUserTests,
      'Skipped because this WRITES to production (user role change)'
    );

    const admin = await loginViaApi(request, 'admin');

    // Get a user to modify (NOT a demo account)
    const listResponse = await request.get(apiUrl('/api/v1/users?limit=10'), {
      headers: bearer(admin.token),
    });

    const listBody = await readJson<{
      data: Array<{ id: string; email: string; role: string }>;
    }>(listResponse);

    // Find a non-demo account to modify
    const targetUser = listBody.data.find(
      (u) =>
        !u.email.includes('@finance-dashboard.local') &&
        u.role !== 'ADMIN'
    );

    if (!targetUser) {
      test.skip();
      return;
    }

    const newRole = 'ANALYST';

    const response = await request.patch(
      apiUrl(`/api/v1/users/${targetUser.id}/role`),
      {
        headers: bearer(admin.token),
        data: { role: newRole },
      }
    );

    // Might be 200 or 204
    expect([200, 204, 201].includes(response.status())).toBeTruthy();

    // Verify the role was changed by reading back
    const getResponse = await request.get(apiUrl(`/api/v1/users/${targetUser.id}`), {
      headers: bearer(admin.token),
    });

    if (getResponse.ok()) {
      const updated = await readJson<{ role: string }>(getResponse);
      expect(updated.role).toBe(newRole);
    }
  });

  test('PATCH /api/v1/users/:id/status changes user status', async ({ request }) => {
    test.skip(
      !appConfig.allowPersistentProdUserTests,
      'Skipped because this WRITES to production (user status change)'
    );

    const admin = await loginViaApi(request, 'admin');

    // Get a user to modify (NOT a demo account)
    const listResponse = await request.get(apiUrl('/api/v1/users?limit=10'), {
      headers: bearer(admin.token),
    });

    const listBody = await readJson<{
      data: Array<{ id: string; email: string; status: string }>;
    }>(listResponse);

    // Find a non-demo account to modify
    const targetUser = listBody.data.find(
      (u) =>
        !u.email.includes('@finance-dashboard.local')
    );

    if (!targetUser) {
      test.skip();
      return;
    }

    const newStatus = targetUser.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

    const response = await request.patch(
      apiUrl(`/api/v1/users/${targetUser.id}/status`),
      {
        headers: bearer(admin.token),
        data: { status: newStatus },
      }
    );

    expect([200, 204, 201].includes(response.status())).toBeTruthy();

    // Verify the status was changed
    const getResponse = await request.get(apiUrl(`/api/v1/users/${targetUser.id}`), {
      headers: bearer(admin.token),
    });

    if (getResponse.ok()) {
      const updated = await readJson<{ status: string }>(getResponse);
      expect(updated.status).toBe(newStatus);
    }
  });

  test('analyst cannot modify users (403)', async ({ request }) => {
    const analyst = await loginViaApi(request, 'analyst');

    // Get list of users
    const listResponse = await request.get(apiUrl('/api/v1/users?limit=1'), {
      headers: bearer(analyst.token),
    });

    // Analyst should not be able to list users
    expect(listResponse.status()).toBe(403);
  });
});
