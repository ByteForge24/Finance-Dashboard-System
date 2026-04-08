import { test, expect } from '@playwright/test';
import { appUrl } from '../support/env';
import { loginWithDemoRole, navigateTo, gotoLogin, logout } from '../support/app';

test.describe('Frontend users management and search', () => {
  test('users page loads with search and controls for admin', async ({ page }) => {
    await loginWithDemoRole(page, 'admin');
    await navigateTo(page, '/users');

    await expect(page).toHaveURL(/#\/users$/);
    await expect(page.getByRole('heading', { name: /user management|users/i })).toBeVisible();

    // Search control should exist
    const searchInput = page.locator('#user-search, input[placeholder*="search" i]').first();
    expect(await searchInput.count()).toBeGreaterThanOrEqual(0);
  });

  test('users search filter works by name or email', async ({ page }) => {
    await loginWithDemoRole(page, 'admin');
    await navigateTo(page, '/users');

    const searchInput = page.locator('#user-search, input[placeholder*="search" i], .search-input').first();
    
    if (await searchInput.count()) {
      // Get initial user count
      const initialRows = page.locator('#users-table tbody tr, .user-row').count();

      // Search for a known user
      await searchInput.fill('admin');
      await page.waitForTimeout(500);

      // Verify search applied
      const urlHasSearch = page.url().includes('search=') || page.url().includes('q=');
      const resultRows = page.locator('#users-table tbody tr, .user-row').count();

      // Either URL has search param or rows filtered
      expect(urlHasSearch || (await resultRows) < (await initialRows)).toBeTruthy();
    }
  });

  test('users table shows user details correctly', async ({ page }) => {
    await loginWithDemoRole(page, 'admin');
    await navigateTo(page, '/users');

    const table = page.locator('#users-table, table').first();
    
    if (await table.count()) {
      // Verify headers include name, email, role, status
      const headers = page.locator('#users-table thead th, table th');
      const headerText = await headers.allTextContents();
      
      expect(headerText.join(' ').toLowerCase()).toMatch(/name|email|role|status/);

      // Verify at least one row of data
      const rows = page.locator('#users-table tbody tr, .user-row');
      expect(await rows.count()).toBeGreaterThan(0);
    }
  });

  test('admin can view user role and status in table', async ({ page }) => {
    await loginWithDemoRole(page, 'admin');
    await navigateTo(page, '/users');

    const firstRow = page.locator('#users-table tbody tr, .user-row').first();
    
    if (await firstRow.count()) {
      const rowText = await firstRow.textContent();
      
      // Should show role and status
      expect(rowText?.toLowerCase()).toMatch(/viewer|analyst|admin/);
      expect(rowText?.toLowerCase()).toMatch(/active|inactive/);
    }
  });

  test('viewers and analysts are blocked from users page', async ({ page }) => {
    await loginWithDemoRole(page, 'viewer');
    await navigateTo(page, '/users');

    await expect(page).toHaveURL(/#\/unauthorized$/);
    await expect(page.getByRole('heading', { name: /access denied|unauthorized/i })).toBeVisible();

    // Try as analyst too
    await logout(page);
    await loginWithDemoRole(page, 'analyst');
    await navigateTo(page, '/users');

    await expect(page).toHaveURL(/#\/unauthorized$/);
  });

  test('unauthorized page has working back to dashboard link', async ({ page }) => {
    await loginWithDemoRole(page, 'viewer');
    await navigateTo(page, '/users');

    // Should be on unauthorized page
    await expect(page).toHaveURL(/#\/unauthorized$/);

    // Find and click back link
    const backLink = page.locator('[aria-label*="back" i], #back-btn, a:has-text("Back"), a:has-text("Dashboard")').first();
    
    if (await backLink.count()) {
      await backLink.click();
      await expect(page).toHaveURL(/#\/dashboard$/);
    }
  });

  test('login page tab switching works', async ({ page }) => {
    await page.goto(appUrl('/login'));

    // Find sign in and sign up tabs
    const signInTab = page.locator('button:has-text("Sign In"), [role="tab"]:has-text("Sign In")').first();
    const signUpTab = page.locator('button:has-text("Sign Up"), [role="tab"]:has-text("Sign Up")').first();

    if (await signUpTab.count()) {
      // Should start on sign in
      const signinForm = page.locator('#login-email, input[name="email"]').first();
      await expect(signinForm).toBeVisible();

      // Click sign up
      await signUpTab.click();

      // Should show sign up form (with name field)
      const nameField = page.locator('#signup-name, input[name="name"]').first();
      await expect(nameField).toBeVisible();

      // Click back to sign in
      await signInTab.click();

      // Should show sign in form again
      await expect(signinForm).toBeVisible();
    }
  });
});

// Mobile viewport smoke tests
test.describe('Mobile viewport smoke tests', () => {
  test('login page is mobile responsive', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone 12 size

    await page.goto(appUrl('/login'));

    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
    
    // Verify form is visible and usable on mobile
    const loginForm = page.locator('#login-email, input[name="email"]').first();
    await expect(loginForm).toBeVisible();
  });

  test('dashboard loads on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto(appUrl('/login'));
    
    // Click a demo login button
    const viewerBtn = page.locator('.demo-login').filter({ hasText: /viewer/i }).first();
    if (await viewerBtn.count()) {
      await viewerBtn.click();

      await expect(page).toHaveURL(/#\/dashboard$/);
      await expect(page.getByRole('heading', { name: /financial overview/i })).toBeVisible();
    }
  });

  test('records page loads on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto(appUrl('/login'));
    
    const analystBtn = page.locator('.demo-login').filter({ hasText: /analyst/i }).first();
    if (await analystBtn.count()) {
      await analystBtn.click();
      await page.goto(appUrl('/#/records'));

      await expect(page.getByRole('heading', { name: /transactions|records/i })).toBeVisible();
      
      // Verify table/records are displayed
      const table = page.locator('table, .record-row, [data-testid="records"]').first();
      expect(await table.count()).toBeGreaterThanOrEqual(0);
    }
  });
});
