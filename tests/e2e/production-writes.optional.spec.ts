import { test, expect } from '@playwright/test';
import { appConfig, apiUrl, uniqueProbeRecord } from '../support/env';
import { loginWithDemoRole, navigateTo } from '../support/app';
import { bearer, loginViaApi, readJson } from '../support/api';

test.describe('Optional production write coverage', () => {
  test.describe.configure({ mode: 'serial' });

  test.skip(
    !appConfig.allowProductionWrites,
    'Set ALLOW_PRODUCTION_WRITES=true to run this persistent production write check.'
  );

  test('admin can create and soft-delete a probe record in production', async ({
    page,
    request,
  }) => {
    const probe = uniqueProbeRecord();
    let createdRecordId: string | null = null;

    await loginWithDemoRole(page, 'admin');
    await navigateTo(page, '/records');
    await expect(page.getByRole('heading', { name: /financial transactions/i })).toBeVisible();

    await page.locator('#create-record-btn').click();
    await page.locator('input[name="amount"]').fill(probe.amount);
    await page.locator('[data-type="expense"]').click();
    await page.locator('#category-input').fill(probe.category);
    await page.locator('input[name="date"]').fill(probe.date);
    await page.locator('textarea[name="notes"]').fill(probe.notes);
    await page.locator('#save-record-btn').click();

    await expect(page.locator('#toast-container')).toContainText(/record created/i);
    await expect(page.locator('tr', { hasText: probe.category })).toBeVisible();

    const admin = await loginViaApi(request, 'admin');
    const lookupResponse = await request.get(
      apiUrl(`/api/v1/records?search=${encodeURIComponent(probe.notes)}&limit=5`),
      {
        headers: bearer(admin.token),
      }
    );
    expect(lookupResponse.ok()).toBeTruthy();

    const lookup = await readJson<{
      data: Array<{ id: string; category: string; notes: string | null }>;
    }>(lookupResponse);
    const created = lookup.data.find((record) => record.notes === probe.notes);
    expect(created).toBeTruthy();
    createdRecordId = created?.id ?? null;

    page.once('dialog', (dialog) => dialog.accept());
    await page.locator('tr', { hasText: probe.category }).getByRole('button', { name: 'Delete' }).click();
    await expect(page.locator('#toast-container')).toContainText(/record deleted/i);

    if (!createdRecordId) {
      throw new Error('The probe record was created in the UI but not found via the API.');
    }

    const deletedLookup = await request.get(apiUrl(`/api/v1/records/${createdRecordId}`), {
      headers: bearer(admin.token),
    });
    expect(deletedLookup.status()).toBe(404);

    const searchAfterDelete = await request.get(
      apiUrl(`/api/v1/records?search=${encodeURIComponent(probe.notes)}&limit=5`),
      {
        headers: bearer(admin.token),
      }
    );
    expect(searchAfterDelete.ok()).toBeTruthy();

    const afterDelete = await readJson<{ data: Array<{ id: string }> }>(searchAfterDelete);
    expect(afterDelete.data.find((record) => record.id === createdRecordId)).toBeFalsy();
  });
});
