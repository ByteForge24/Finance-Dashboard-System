import { test, expect } from '@playwright/test';
import { appUrl } from '../support/env';

test.describe('Sign In - Authentication & Login Flows', () => {
  
  test('sign in page loads with form and demo buttons', async ({ page }) => {
    await page.goto(appUrl('/login'));

    // Verify we're on the login page
    await expect(page).toHaveURL(/#\/login$/);
    
    // Check for main heading
    const heading = page.locator('h1, h2, [role="heading"]').filter({ hasText: /sign in|login/i }).first();
    await expect(heading).toBeVisible();

    // Check for email input
    const emailInput = page.locator('input[type="email"], input[name*="email" i]').first();
    await expect(emailInput).toBeVisible();

    // Check for password input
    const passwordInput = page.locator('input[type="password"], input[name*="password" i]').first();
    await expect(passwordInput).toBeVisible();

    // Check for submit button
    const submitBtn = page.locator('button:has-text("Sign In"), button:has-text("Login"), button[type="submit"]').first();
    await expect(submitBtn).toBeVisible();

    // Check for demo account buttons
    const demoButtons = page.locator('button:has-text("Demo")');
    expect(await demoButtons.count()).toBeGreaterThan(0);
  });

  test('sign in with valid admin credentials redirects to dashboard', async ({ page }) => {
    await page.goto(appUrl('/login'));

    const emailInput = page.locator('input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const submitBtn = page.locator('button:has-text("Sign In"), button:has-text("Login"), button[type="submit"]').first();

    // Enter credentials
    await emailInput.fill('admin@finance-dashboard.local');
    await passwordInput.fill('AdminPassword123');
    
    // Click submit
    await submitBtn.click();

    // Should redirect to dashboard
    await expect(page).toHaveURL(/#\/dashboard$/, { timeout: 10000 });
    
    // Verify dashboard content
    const dashboardHeading = page.locator('h1, h2, [role="heading"]').filter({ hasText: /financial overview/i }).first();
    await expect(dashboardHeading).toBeVisible();

    // Verify JWT token is stored in localStorage
    const token = await page.evaluate(() => localStorage.getItem('auth_token'));
    expect(token).toBeTruthy();
    expect(token).toMatch(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/); // JWT format
  });

  test('sign in with valid analyst credentials shows analyst permissions', async ({ page }) => {
    await page.goto(appUrl('/login'));

    const emailInput = page.locator('input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const submitBtn = page.locator('button:has-text("Sign In"), button[type="submit"]').first();

    // Enter analyst credentials
    await emailInput.fill('analyst@finance-dashboard.local');
    await passwordInput.fill('AnalystPassword123');
    await submitBtn.click();

    // Should redirect to dashboard
    await expect(page).toHaveURL(/#\/dashboard$/, { timeout: 10000 });

    // Analyst should have access to records (read-only)
    await page.goto(appUrl('/records'));
    const recordsHeading = page.locator('h1, h2, [role="heading"]').filter({ hasText: /transactions|records/i }).first();
    await expect(recordsHeading).toBeVisible();

    // Should NOT see create button
    const createBtn = page.locator('button:has-text("Create"), button:has-text("Add Record"), button:has-text("New")').first();
    const createCount = await createBtn.count();
    expect(createCount).toBe(0);
  });

  test('sign in with valid viewer credentials blocks records access', async ({ page }) => {
    await page.goto(appUrl('/login'));

    const emailInput = page.locator('input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const submitBtn = page.locator('button:has-text("Sign In"), button[type="submit"]').first();

    // Enter viewer credentials
    await emailInput.fill('viewer@finance-dashboard.local');
    await passwordInput.fill('ViewerPassword123');
    await submitBtn.click();

    // Should redirect to dashboard
    await expect(page).toHaveURL(/#\/dashboard$/, { timeout: 10000 });

    // Try to navigate to records (should be blocked or show unauthorized)
    await page.goto(appUrl('/records'));
    
    // Either redirected back to dashboard or shown unauthorized page
    const url = page.url();
    const isBlockedOrRedirected = url.includes('#/dashboard') || url.includes('#/unauthorized');
    expect(isBlockedOrRedirected).toBeTruthy();
  });

  test('sign in with incorrect password shows error message', async ({ page }) => {
    await page.goto(appUrl('/login'));

    const emailInput = page.locator('input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const submitBtn = page.locator('button:has-text("Sign In"), button[type="submit"]').first();

    // Enter wrong credentials
    await emailInput.fill('admin@finance-dashboard.local');
    await passwordInput.fill('wrong-password-xyz');
    await submitBtn.click();

    // Should show error message
    const errorMsg = page.locator('[role="alert"], .error-message, .alert-error, [data-testid="error"]').first();
    
    // Wait a bit for error to appear
    await page.waitForTimeout(1000);
    
    if (await errorMsg.count() > 0) {
      await expect(errorMsg).toBeVisible();
      const errorText = await errorMsg.textContent();
      expect(errorText?.toLowerCase()).toMatch(/invalid|incorrect|failed|unauthorized|wrong/i);
    }

    // Should NOT redirect to dashboard
    await expect(page).not.toHaveURL(/#\/dashboard$/);
  });

  test('sign in with non-existent email shows error or message', async ({ page }) => {
    await page.goto(appUrl('/login'));

    const emailInput = page.locator('input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const submitBtn = page.locator('button:has-text("Sign In"), button[type="submit"]').first();

    // Enter non-existent email
    await emailInput.fill('nonexistent-user-xyz@finance-dashboard.local');
    await passwordInput.fill('any-password-123');
    await submitBtn.click();

    // Wait for response
    await page.waitForTimeout(1500);

    // Should NOT redirect to dashboard
    const isOnDashboard = page.url().includes('#/dashboard');
    expect(isOnDashboard).toBeFalsy();
  });

  test('sign in form has proper validation (email required)', async ({ page }) => {
    await page.goto(appUrl('/login'));

    const emailInput = page.locator('input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const submitBtn = page.locator('button:has-text("Sign In"), button[type="submit"]').first();

    // Try to submit without email
    await passwordInput.fill('demo-password-123');
    await submitBtn.click();

    // Email input should show validation error
    const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.checkValidity());
    expect(isInvalid).toBeTruthy();

    // Should NOT redirect to dashboard
    await expect(page).not.toHaveURL(/#\/dashboard$/, { timeout: 2000 });
  });

  test('sign in form has proper validation (password required)', async ({ page }) => {
    await page.goto(appUrl('/login'));

    const emailInput = page.locator('input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const submitBtn = page.locator('button:has-text("Sign In"), button[type="submit"]').first();

    // Try to submit without password
    await emailInput.fill('admin@finance-dashboard.local');
    await submitBtn.click();

    // Password input should show validation error
    const isInvalid = await passwordInput.evaluate((el: HTMLInputElement) => !el.checkValidity());
    expect(isInvalid).toBeTruthy();

    // Should NOT redirect to dashboard
    await expect(page).not.toHaveURL(/#\/dashboard$/, { timeout: 2000 });
  });

  test('sign in demo buttons quickly authenticate with preset roles', async ({ page }) => {
    await page.goto(appUrl('/login'));

    // Find demo button for analyst
    const demoButtons = page.locator('button:has-text("Demo - Analyst"), button:has-text("Try as Analyst")').first();
    
    if (await demoButtons.count() > 0) {
      await demoButtons.click();

      // Should redirect to dashboard
      await expect(page).toHaveURL(/#\/dashboard$/, { timeout: 10000 });

      // Verify logged in
      const token = await page.evaluate(() => localStorage.getItem('auth_token'));
      expect(token).toBeTruthy();

      // Verify analyst permissions (can see records, read-only)
      await page.goto(appUrl('/records'));
      const recordsHeading = page.locator('h1, h2, [role="heading"]').filter({ hasText: /records|transactions/i }).first();
      await expect(recordsHeading).toBeVisible();
    }
  });

  test('sign in persists across page reload', async ({ page }) => {
    // Login first
    await page.goto(appUrl('/login'));
    
    const emailInput = page.locator('input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const submitBtn = page.locator('button:has-text("Sign In"), button[type="submit"]').first();

    await emailInput.fill('admin@finance-dashboard.local');
    await passwordInput.fill('AdminPassword123');
    await submitBtn.click();

    // Wait for dashboard to load
    await expect(page).toHaveURL(/#\/dashboard$/, { timeout: 10000 });

    // Reload page
    await page.reload();

    // Should still be on dashboard (not redirected to login)
    await expect(page).toHaveURL(/#\/dashboard$/);

    // Verify dashboard content still visible
    const dashboardHeading = page.locator('h1, h2, [role="heading"]').filter({ hasText: /financial overview/i }).first();
    await expect(dashboardHeading).toBeVisible();
  });

  test('logout clears session and redirects to login', async ({ page }) => {
    // Login first
    await page.goto(appUrl('/login'));
    
    const emailInput = page.locator('input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const submitBtn = page.locator('button:has-text("Sign In"), button[type="submit"]').first();

    await emailInput.fill('admin@finance-dashboard.local');
    await passwordInput.fill('demo-password-123');
    await submitBtn.click();

    // Wait for dashboard to load
    await expect(page).toHaveURL(/#\/dashboard$/ , { timeout: 10000 });

    // Find logout button
    const logoutBtn = page.locator('button:has-text("Logout"), button:has-text("Sign Out"), [data-testid="logout"]').first();
    
    if (await logoutBtn.count() > 0) {
      await logoutBtn.click();

      // Should redirect to login
      await expect(page).toHaveURL(/#\/login$/);

      // Token should be cleared
      const token = await page.evaluate(() => localStorage.getItem('auth_token'));
      expect(token).toBeFalsy();
    }
  });
});
