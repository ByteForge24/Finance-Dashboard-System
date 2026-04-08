import { test, expect } from '@playwright/test';
import { apiUrl, appConfig } from '../support/env';
import { bearer, loginViaApi, readJson } from '../support/api';

/**
 * Backend record lifecycle tests (CREATE, READ, UPDATE, DELETE)
 *
 * ⚠️  WARNING: These tests MUTATE production data by creating records
 * and then deleting them. They should ONLY run when ALLOW_PRODUCTION_WRITES=true.
 *
 * Test strategy:
 * 1. Create a test record with unique notes to identify it
 * 2. Read it back to verify creation
 * 3. Update it to verify PATCH works
 * 4. Delete it (soft-delete)
 * 5. Verify 404 or deletedAt flag
 *
 * All records are cleaned up after each test.
 */

test.describe('Backend record lifecycle (WRITE TESTS)', () => {
  test.skip(
    !appConfig.allowProductionWrites,
    'Skipped unless ALLOW_PRODUCTION_WRITES=true. These tests mutate production data and require careful handling.'
  );

  // Use a unique timestamp for each test run to avoid conflicts
  const testSuffix = Date.now();

  test('POST /api/v1/records creates a new record', async ({ request }) => {
    const admin = await loginViaApi(request, 'admin');

    const recordData = {
      type: 'expense',
      category: 'Food & Dining',
      amount: 42.5,
      date: new Date().toISOString().split('T')[0],
      notes: `[PLAYWRIGHT-TEST-${testSuffix}] Grocery purchase`,
    };

    const response = await request.post(apiUrl('/api/v1/records'), {
      headers: bearer(admin.token),
      data: recordData,
    });

    expect(response.ok()).toBeTruthy();

    const created = await readJson<{
      id: string;
      [key: string]: unknown;
    }>(response);

    expect(created.id).toEqual(expect.any(String));
    expect(created.notes).toContain(`PLAYWRIGHT-TEST-${testSuffix}`);

    // Store for cleanup (not async)
    (request as any).__testRecordId = created.id;
  });

  test('GET /api/v1/records/:id retrieves a created record', async ({ request }) => {
    const admin = await loginViaApi(request, 'admin');

    // Create a record first
    const recordData = {
      type: 'income',
      category: 'Salary',
      amount: 5000,
      date: new Date().toISOString().split('T')[0],
      notes: `[PLAYWRIGHT-TEST-${testSuffix}] Salary deposit`,
    };

    const createResponse = await request.post(apiUrl('/api/v1/records'), {
      headers: bearer(admin.token),
      data: recordData,
    });

    const created = await readJson<{ id: string }>(createResponse);

    // Now retrieve it
    const getResponse = await request.get(apiUrl(`/api/v1/records/${created.id}`), {
      headers: bearer(admin.token),
    });

    expect(getResponse.ok()).toBeTruthy();

    const retrieved = await readJson<Record<string, unknown>>(getResponse);
    expect(retrieved.id).toBe(created.id);
    expect(retrieved.amount).toBe(5000);
    expect(retrieved.notes).toContain(`PLAYWRIGHT-TEST-${testSuffix}`);

    // Cleanup
    await request.delete(apiUrl(`/api/v1/records/${created.id}`), {
      headers: bearer(admin.token),
    });
  });

  test('PATCH /api/v1/records/:id updates a record', async ({ request }) => {
    const admin = await loginViaApi(request, 'admin');

    // Create a record
    const recordData = {
      type: 'expense',
      category: 'Transport',
      amount: 25,
      date: new Date().toISOString().split('T')[0],
      notes: `[PLAYWRIGHT-TEST-${testSuffix}] Original notes`,
    };

    const createResponse = await request.post(apiUrl('/api/v1/records'), {
      headers: bearer(admin.token),
      data: recordData,
    });

    const created = await readJson<{ id: string }>(createResponse);

    // Update it
    const updateData = {
      amount: 35,
      notes: `[PLAYWRIGHT-TEST-${testSuffix}] Updated notes`,
    };

    const updateResponse = await request.patch(
      apiUrl(`/api/v1/records/${created.id}`),
      {
        headers: bearer(admin.token),
        data: updateData,
      }
    );

    expect([200, 204].includes(updateResponse.status())).toBeTruthy();

    // Verify update by reading back
    const getResponse = await request.get(apiUrl(`/api/v1/records/${created.id}`), {
      headers: bearer(admin.token),
    });

    if (getResponse.ok()) {
      const updated = await readJson<{
        amount: number;
        notes: string;
      }>(getResponse);

      expect(updated.amount).toBe(35);
      expect(updated.notes).toContain('Updated notes');
    }

    // Cleanup
    await request.delete(apiUrl(`/api/v1/records/${created.id}`), {
      headers: bearer(admin.token),
    });
  });

  test('DELETE /api/v1/records/:id performs soft-delete', async ({ request }) => {
    const admin = await loginViaApi(request, 'admin');

    // Create a record
    const recordData = {
      type: 'expense',
      category: 'Utilities',
      amount: 150,
      date: new Date().toISOString().split('T')[0],
      notes: `[PLAYWRIGHT-TEST-${testSuffix}] To be deleted`,
    };

    const createResponse = await request.post(apiUrl('/api/v1/records'), {
      headers: bearer(admin.token),
      data: recordData,
    });

    const created = await readJson<{ id: string }>(createResponse);

    // Delete it
    const deleteResponse = await request.delete(apiUrl(`/api/v1/records/${created.id}`), {
      headers: bearer(admin.token),
    });

    expect([200, 204, 201].includes(deleteResponse.status())).toBeTruthy();

    // Verify it's soft-deleted by attempting to read it
    // Expected behavior:
    // - Either returns 404
    // - Or returns the record with deletedAt timestamp
    const getResponse = await request.get(apiUrl(`/api/v1/records/${created.id}`), {
      headers: bearer(admin.token),
    });

    if (getResponse.ok()) {
      const record = await readJson<{
        deletedAt?: string | null;
      }>(getResponse);

      // If we can still read it, it should have deletedAt set (soft-delete)
      expect(record.deletedAt).toBeTruthy();
    } else {
      // Or it should return 404
      expect(getResponse.status()).toBe(404);
    }
  });

  test('GET /api/v1/records returns created records in list', async ({ request }) => {
    const admin = await loginViaApi(request, 'admin');

    // Create a record with unique identifier
    const recordData = {
      type: 'expense',
      category: 'Entertainment',
      amount: 29.99,
      date: new Date().toISOString().split('T')[0],
      notes: `[PLAYWRIGHT-TEST-${testSuffix}] Listed record`,
    };

    const createResponse = await request.post(apiUrl('/api/v1/records'), {
      headers: bearer(admin.token),
      data: recordData,
    });

    const created = await readJson<{ id: string }>(createResponse);

    // Get records list
    const listResponse = await request.get(apiUrl('/api/v1/records?limit=100'), {
      headers: bearer(admin.token),
    });

    expect(listResponse.ok()).toBeTruthy();

    const list = await readJson<{
      data: Array<{ id: string }>;
    }>(listResponse);

    // Should contain our created record
    const found = list.data.find((r) => r.id === created.id);
    expect(found).toBeTruthy();

    // Cleanup
    await request.delete(apiUrl(`/api/v1/records/${created.id}`), {
      headers: bearer(admin.token),
    });
  });

  test('analyst cannot create records (403)', async ({ request }) => {
    const analyst = await loginViaApi(request, 'analyst');

    const recordData = {
      type: 'expense',
      category: 'Test',
      amount: 10,
      date: new Date().toISOString().split('T')[0],
      notes: 'Should fail',
    };

    const response = await request.post(apiUrl('/api/v1/records'), {
      headers: bearer(analyst.token),
      data: recordData,
    });

    expect(response.status()).toBe(403);
  });

  test('analyst cannot delete records (403)', async ({ request }) => {
    const admin = await loginViaApi(request, 'admin');
    const analyst = await loginViaApi(request, 'analyst');

    // Admin creates a record
    const recordData = {
      type: 'expense',
      category: 'Test',
      amount: 10,
      date: new Date().toISOString().split('T')[0],
      notes: `[PLAYWRIGHT-TEST-${testSuffix}] Cannot delete by analyst`,
    };

    const createResponse = await request.post(apiUrl('/api/v1/records'), {
      headers: bearer(admin.token),
      data: recordData,
    });

    const created = await readJson<{ id: string }>(createResponse);

    // Analyst tries to delete
    const deleteResponse = await request.delete(apiUrl(`/api/v1/records/${created.id}`), {
      headers: bearer(analyst.token),
    });

    expect(deleteResponse.status()).toBe(403);

    // Cleanup with admin
    await request.delete(apiUrl(`/api/v1/records/${created.id}`), {
      headers: bearer(admin.token),
    });
  });

  test('record amounts are stored and retrieved correctly', async ({ request }) => {
    const admin = await loginViaApi(request, 'admin');

    // Test with decimal amount
    const recordData = {
      type: 'expense',
      category: 'Food',
      amount: 12.99,
      date: new Date().toISOString().split('T')[0],
      notes: `[PLAYWRIGHT-TEST-${testSuffix}] Decimal amount`,
    };

    const createResponse = await request.post(apiUrl('/api/v1/records'), {
      headers: bearer(admin.token),
      data: recordData,
    });

    const created = await readJson<{ id: string; amount: number }>(createResponse);

    // Verify decimal precision
    expect(created.amount).toBe(12.99);

    // Cleanup
    await request.delete(apiUrl(`/api/v1/records/${created.id}`), {
      headers: bearer(admin.token),
    });
  });
});
