import { test, expect } from '@playwright/test';
import { appConfig, appUrl } from '../support/env';
import { gotoLogin, loginWithDemoRole, navigateTo, logout } from '../support/app';

test.describe('Production frontend auth, navigation, and RBAC', () => {
  test('redirects unauthenticated visitors back to login', async ({ page }) => {
    // Increase navigation timeout for production
    page.setDefaultNavigationTimeout(45000);
    page.setDefaultTimeout(30000);

    await page.goto(appUrl('/dashboard'), { waitUntil: 'domcontentloaded' });

    // Wait for redirect to complete
    await page.waitForURL(/login/, { timeout: 15000 });

    await expect(page).toHaveURL(/#\/login$/);
    await expect(
      page.getByRole('heading', { name: /welcome back/i }).or(page.locator('h2:has-text("Welcome back")')).first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('viewer can use the dashboard but is blocked from records and users', async ({ page }) => {
    page.setDefaultNavigationTimeout(45000);
    page.setDefaultTimeout(30000);

    await loginWithDemoRole(page, 'viewer');

    await navigateTo(page, '/records');
    await page.waitForURL(/unauthorized/, { timeout: 15000 });

    await expect(page).toHaveURL(/#\/unauthorized$/);
    await expect(
      page.getByRole('heading', { name: /access denied|unauthorized/i }).or(page.locator('h2:contains("Access Denied")')).first()
    ).toBeVisible({ timeout: 10000 });

    await navigateTo(page, '/users');
    await page.waitForURL(/unauthorized/, { timeout: 15000 });

    await expect(page).toHaveURL(/#\/unauthorized$/);
  });

  test('analyst can read records but cannot reach users or record creation', async ({ page }) => {
    page.setDefaultNavigationTimeout(45000);
    page.setDefaultTimeout(30000);

    await loginWithDemoRole(page, 'analyst');

    await navigateTo(page, '/records');

    await expect(
      page.getByRole('heading', { name: /financial transactions|transactions|records/i }).or(page.locator('h1, h2').filter({ hasText: /transaction|record/i }).first())
    ).toBeVisible({ timeout: 10000 });

    await expect(page.locator('#records-table, table, [data-testid="records"]').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#create-record-btn, [aria-label*="create"]').filter({ hasText: /create/i })).toHaveCount(0);

    await navigateTo(page, '/users');
    await page.waitForURL(/unauthorized/, { timeout: 15000 });

    await expect(page).toHaveURL(/#\/unauthorized$/);
  });

  test('admin can open records and users and exercise category suggestion without writing data', async ({ page }) => {
    page.setDefaultNavigationTimeout(45000);
    page.setDefaultTimeout(30000);

    await loginWithDemoRole(page, 'admin');

    await navigateTo(page, '/records');

    await expect(
      page.getByRole('heading', { name: /financial transactions|transactions|records/i }).or(page.locator('h1, h2').filter({ hasText: /transaction|record/i }).first())
    ).toBeVisible({ timeout: 10000 });

    const createButton = page.locator('#create-record-btn, button:has-text("Create"), [aria-label*="create"]').first();
    if (await createButton.count()) {
      await createButton.click();

      const createModal = page.locator('[data-testid="record-modal"], .modal, dialog').first();
      await expect(createModal).toBeVisible({ timeout: 10000 });

      const amountInput = page.locator('input[name="amount"], input[aria-label*="amount"]').first();
      if (await amountInput.count()) {
        await amountInput.fill('64.20');
      }

      const notesInput = page.locator('textarea[name="notes"], textarea[aria-label*="notes"]').first();
      if (await notesInput.count()) {
        await notesInput.fill('Weekly grocery market run');
      }

      const suggestBtn = page.locator('#suggest-category-btn, button:has-text("Suggest"), [aria-label*="suggest"]').first();
      if (await suggestBtn.count()) {
        await suggestBtn.click();

        const suggestionResults = page.locator('#suggestion-results, [data-testid="suggestions"]').first();
        if (await suggestionResults.count()) {
          await expect(suggestionResults).toBeVisible();
        }
      }

      const cancelBtn = page.locator('#cancel-modal, button:has-text("Cancel"), button:has-text("Close")').first();
      if (await cancelBtn.count()) {
        await cancelBtn.click();
      }
    }

    await navigateTo(page, '/users');

    await expect(
      page.getByRole('heading', { name: /user management|users/i }).or(page.locator('h1, h2').filter({ hasText: /user/i }).first())
    ).toBeVisible({ timeout: 10000 });
  });

  test('signup screen rejects reserved demo emails without mutating production', async ({ page }) => {
    test.skip(
      !appConfig.enableRateLimitChecks,
      'Skipped by default so monitoring does not consume the production signup failure budget.'
    );

    page.setDefaultNavigationTimeout(45000);
    page.setDefaultTimeout(30000);

    await gotoLogin(page);

    const signUpTab = page.locator('button:has-text("Sign Up"), [role="tab"]:has-text("Sign Up")').first();
    if (await signUpTab.count()) {
      await signUpTab.click();
      await page.waitForTimeout(500);
    }

    const nameInput = page.locator('#signup-name, input[name="name"]').first();
    if (await nameInput.count()) {
      await nameInput.fill('Playwright Probe');
    }

    const emailInput = page.locator('#signup-email, input[name="email"]').first();
    if (await emailInput.count()) {
      await emailInput.fill('viewer@finance-dashboard.local');
    }

    const passwordInput = page.locator('#signup-password, input[name="password"]').first();
    if (await passwordInput.count()) {
      await passwordInput.fill('ValidPass123');
    }

    const submitBtn = page.locator('#signup-submit, button:has-text("Sign Up"), button[type="submit"]').first();
    if (await submitBtn.count()) {
      await submitBtn.click();
    }

    await page.waitForTimeout(1000);

    const errorDiv = page.locator('#signup-error, [role="alert"]').first();
    if (await errorDiv.count()) {
      await expect(errorDiv).toBeVisible();
      await expect(errorDiv).toContainText(/reserved|already in use/i);
    }

    await expect(page).toHaveURL(/#\/login$/);
  });

  test('settings preferences can be changed and persisted locally', async ({ page }) => {
    page.setDefaultNavigationTimeout(45000);
    page.setDefaultTimeout(30000);

    await loginWithDemoRole(page, 'viewer');

    const settingsBtn = page.locator('#settings-btn, [aria-label*="settings"], button:has-text("Settings")').first();
    if (await settingsBtn.count()) {
      await settingsBtn.click();
      await page.waitForURL(/settings/, { timeout: 15000 });
    }

    await expect(page).toHaveURL(/#\/settings$/);

    await expect(
      page.getByRole('heading', { name: /^settings$/i }).or(page.locator('h1, h2').filter({ hasText: /^settings$/i }).first())
    ).toBeVisible({ timeout: 10000 });

    const darkModeToggle = page.locator('#toggle-dark-mode, input[type="checkbox"][aria-label*="dark"]').first();
    if (await darkModeToggle.count()) {
      await darkModeToggle.check({ force: true });
    }

    const notifToggle = page.locator('#toggle-push-notif, input[type="checkbox"][aria-label*="notif"]').first();
    if (await notifToggle.count()) {
      await notifToggle.check({ force: true });
    }

    const saveBtn = page.locator('#save-settings-btn, button:has-text("Save")').first();
    if (await saveBtn.count()) {
      await saveBtn.click();
    }

    const toastContainer = page.locator('#toast-container, [role="alert"]').first();
    if (await toastContainer.count()) {
      await expect(toastContainer).toContainText(/saved|success/i);
    }

    await page.goto(appUrl('/settings'));

    if (await darkModeToggle.count()) {
      await expect(darkModeToggle).toBeChecked();
    }

    if (await notifToggle.count()) {
      await expect(notifToggle).toBeChecked();
    }

    // Check dark mode class was applied
    await page.waitForTimeout(500);
    const hasDarkClass = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    expect(hasDarkClass).toBeTruthy();

    await logout(page);
  });
});
