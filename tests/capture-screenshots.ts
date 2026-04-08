import { chromium } from '@playwright/test';
import * as fs from 'fs';

const SCREENSHOTS_DIR = 'c:\\Users\\HP\\finance-dashboard-system\\screenshots';
const BASE_URL = 'https://finance-dashboard-pro.netlify.app';

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function captureScreenshots() {
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1280, height: 720 },
  });

  try {
    console.log('📸 Starting screenshot capture...\n');

    // 1. Login Page (Public - no auth required)
    console.log('1️⃣  Capturing Login Page...');
    await page.goto(BASE_URL + '/#/login', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: SCREENSHOTS_DIR + '/01-login-page.png', fullPage: false });
    console.log('✅ Login page captured\n');

    // 2. Dashboard Page (Auth required - login as analyst first)
    console.log('2️⃣  Authenticating as Analyst & Capturing Dashboard...');
    await page.goto(BASE_URL + '/#/login', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    
    // Fill login form (use specific IDs to avoid ambiguity)
    await page.fill('#login-email', 'analyst@finance-dashboard.local');
    await page.fill('#login-password', 'AnalystPassword123');
    
    // Click login button
    const loginBtn = await page.locator('#login-form').locator('button').filter({ hasText: /Sign In|Login/ }).first();
    await loginBtn.click();
    
    // Wait for navigation to dashboard
    await page.waitForURL(BASE_URL + '/#/dashboard', { timeout: 10000 });
    // Wait for content to load
    try {
      await page.waitForSelector('canvas, [class*="chart"], [class*="summary"]', { timeout: 8000 });
    } catch (e) {
      await page.waitForTimeout(3000);
    }
    await page.screenshot({ path: SCREENSHOTS_DIR + '/02-dashboard-page.png', fullPage: true });
    console.log('✅ Dashboard page captured\n');

    // 3. Records Page
    console.log('3️⃣  Capturing Records Page...');
    await page.goto(BASE_URL + '/#/records', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: SCREENSHOTS_DIR + '/03-records-page.png', fullPage: false });
    console.log('✅ Records page captured\n');

    // 4. Unauthorized Page (Login as Viewer, try to access Users)
    console.log('4️⃣  Logging out and capturing Unauthorized Page...');
    
    // Logout by clearing storage
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    await page.goto(BASE_URL + '/#/login', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    
    // Login as viewer (use specific IDs)
    await page.fill('#login-email', 'viewer@finance-dashboard.local');
    await page.fill('#login-password', 'ViewerPassword123');
    
    const loginBtn2 = await page.locator('#login-form').locator('button').filter({ hasText: /Sign In|Login/ }).first();
    await loginBtn2.click();
    
    await page.waitForURL(BASE_URL + '/#/dashboard', { timeout: 10000 });
    await page.waitForTimeout(1000);
    
    // Try to access users (should show unauthorized)
    await page.goto(BASE_URL + '/#/users', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: SCREENSHOTS_DIR + '/04-unauthorized-page.png', fullPage: false });
    console.log('✅ Unauthorized page captured\n');

    console.log('🎉 All screenshots captured!\n');
    console.log('📁 Location: ' + SCREENSHOTS_DIR);

  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : String(error));
  } finally {
    await browser.close();
  }
}

captureScreenshots();
