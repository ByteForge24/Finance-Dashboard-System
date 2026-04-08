import { Page, expect } from '@playwright/test';
import { appUrl, demoAccounts, DemoRole } from './env';

const SETUP_TIMEOUT = 45000;
const ELEMENT_TIMEOUT = 20000;

export async function gotoLogin(page: Page) {
  // Set appropriate timeouts for production
  page.setDefaultNavigationTimeout(SETUP_TIMEOUT);
  page.setDefaultTimeout(ELEMENT_TIMEOUT);

  await page.goto(appUrl('/login'), { waitUntil: 'domcontentloaded' });
  
  // Wait for the page to be interactive
  await page.waitForLoadState('networkidle').catch(() => null); // Optional, may timeout on slow networks

  // Find login heading with multiple selectors
  const heading = page.getByRole('heading', { name: /welcome back/i })
    .or(page.locator('h2:has-text("Welcome back")'))
    .first();

  await expect(heading).toBeVisible({ timeout: ELEMENT_TIMEOUT });
}

export async function loginWithDemoRole(page: Page, role: DemoRole) {
  await gotoLogin(page);

  const demoBtn = page
    .locator('.demo-login')
    .filter({ hasText: demoAccounts[role].label })
    .first();

  if (!(await demoBtn.count())) {
    throw new Error(`Demo button for role '${role}' not found. Label: ${demoAccounts[role].label}`);
  }

  await demoBtn.click();

  // Wait for navigation and dashboard to be ready
  await page.waitForURL(/#\/dashboard$/, { timeout: SETUP_TIMEOUT });
  
  const dashboardHeading = page.getByRole('heading', { name: /financial overview|dashboard/i })
    .or(page.locator('h1:has-text("Dashboard")'))
    .or(page.locator('h1:has-text("Financial Overview")'))
    .first();

  await expect(dashboardHeading).toBeVisible({ timeout: ELEMENT_TIMEOUT });
}

export async function loginWithCredentials(page: Page, email: string, password: string) {
  await gotoLogin(page);

  const emailInput = page.locator('#login-email').or(page.locator('input[name="email"]')).first();
  const passwordInput = page.locator('#login-password').or(page.locator('input[name="password"]')).first();
  const submitBtn = page.locator('#login-submit').or(page.locator('button[type="submit"]')).first();

  if (!(await emailInput.count())) throw new Error('Email input not found');
  if (!(await passwordInput.count())) throw new Error('Password input not found');
  if (!(await submitBtn.count())) throw new Error('Submit button not found');

  await emailInput.fill(email);
  await passwordInput.fill(password);
  await submitBtn.click();

  // Wait for navigation
  await page.waitForURL(/#\/dashboard$/, { timeout: SETUP_TIMEOUT }).catch(
    () => null // May redirect to unauthorized immediately
  );
}

export async function navigateTo(page: Page, hashPath: string) {
  await page.goto(appUrl(hashPath), { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle').catch(() => null);
}

export async function logout(page: Page) {
  const logoutBtn = page.locator('#logout-btn').or(page.locator('button:has-text("Logout")')).first();

  if (!(await logoutBtn.count())) {
    console.warn('Logout button not found, attempting to navigate to login');
    await page.goto(appUrl('/login'));
  } else {
    await logoutBtn.click();
  }

  await page.waitForURL(/#\/login$/, { timeout: SETUP_TIMEOUT });

  const heading = page.getByRole('heading', { name: /welcome back/i })
    .or(page.locator('h2:has-text("Welcome back")'))
    .first();

  await expect(heading).toBeVisible({ timeout: ELEMENT_TIMEOUT });
}
