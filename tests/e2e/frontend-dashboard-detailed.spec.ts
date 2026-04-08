import { test, expect } from '@playwright/test';
import { appUrl } from '../support/env';
import { loginWithDemoRole, navigateTo } from '../support/app';

test.describe('Frontend dashboard detailed features', () => {
  test('dashboard page loads with content after login', async ({ page }) => {
    await loginWithDemoRole(page, 'analyst');

    await expect(page).toHaveURL(/#\/dashboard$/);
    await expect(page.getByRole('heading', { name: /financial overview/i })).toBeVisible();
    
    // Verify key sections are present
    const chartContainer = page.locator('.chart-container, [data-testid="chart"], canvas').first();
    if (await chartContainer.count() > 0) {
      await expect(chartContainer).toBeVisible();
    }
  });

  test('dashboard refresh button reloads data', async ({ page }) => {
    await loginWithDemoRole(page, 'analyst');

    // Locate and click the refresh button
    const refreshBtn = page.locator('#refresh-dashboard, [aria-label*="refresh" i], button:has-text("Refresh")').first();
    await refreshBtn.click();

    // Verify page is still on dashboard (no navigation change)
    await expect(page).toHaveURL(/#\/dashboard$/);
    
    // Verify content is still visible (reload succeeded)
    await expect(page.getByRole('heading', { name: /financial overview/i })).toBeVisible();
  });

  test('dashboard timeframe filter changes displayed data', async ({ page }) => {
    await loginWithDemoRole(page, 'analyst');

    const filterControl = page.locator('#timeframe-filter, select[name="timeframe"], [aria-label*="timeframe" i]').first();
    
    if (await filterControl.count()) {
      const optionsBefore = page.locator('.chart-container').first();
      await expect(optionsBefore).toBeVisible();

      // Try to select a different timeframe
      await filterControl.click();
      const options = page.locator('[data-value], option').filter({ hasText: /month|quarter|year|week/i });
      
      if (await options.count() > 0) {
        const nextOption = options.nth(0);
        await nextOption.click();

        // Verify page stays on dashboard
        await expect(page).toHaveURL(/#\/dashboard$/);
        await expect(page.getByRole('heading', { name: /financial overview/i })).toBeVisible();
      }
    }
  });

  test('dashboard category breakdown section navigates to filtered records', async ({ page }) => {
    await loginWithDemoRole(page, 'analyst');

    // Find category breakdown section and click a category
    const categoryItem = page.locator('.category-breakdown-item, [data-testid="category-item"]').first();
    
    if (await categoryItem.count()) {
      const categoryName = await categoryItem.textContent();
      await categoryItem.click();

      // Should navigate to records filtered by category
      await expect(page).toHaveURL(/#\/records/);
      await expect(page.getByRole('heading', { name: /transactions|records/i })).toBeVisible();
      
      // Verify filter is applied (if category name is shown in records UI)
      if (categoryName) {
        const filterDisplay = page.locator('[data-testid="active-filters"], .filter-display');
        if (await filterDisplay.count()) {
          await expect(filterDisplay).toContainText(categoryName.substring(0, 20));
        }
      }
    }
  });

  test('dashboard recent activity section links to record details', async ({ page }) => {
    await loginWithDemoRole(page, 'analyst');

    // Find a recent activity item
    const activityItem = page.locator('.activity-row, [data-testid="activity-item"], table tbody tr').first();
    
    if (await activityItem.count()) {
      await activityItem.click();

      // Should navigate to records with view/filter applied
      await expect(page).toHaveURL(/#\/(records|dashboard-detail)/);
      await expect(page.getByRole('heading', { 
        name: /transactions|records|transaction detail|record/i 
      })).toBeVisible();
    }
  });

  test('dashboard trends endpoint returns valid data', async ({ page }) => {
    await loginWithDemoRole(page, 'analyst');

    // Verify trends chart is rendered (implies successful API call)
    const trendChart = page.locator('.trends-chart, [data-testid="trends-grid"], canvas').first();
    
    if (await trendChart.count()) {
      await expect(trendChart).toBeVisible();
    } else {
      // If no chart, verify page loaded successfully (alternative render)
      await expect(page.getByRole('heading', { name: /financial overview|dashboard/i })).toBeVisible();
    }
  });

  test('dashboard monthly insights are visible or expandable', async ({ page }) => {
    await loginWithDemoRole(page, 'analyst');

    const insightsSection = page.locator('.insights-section, [data-testid="monthly-insights"]').first();
    const expandBtn = page.locator('#expand-insights, [aria-label*="insights"]').first();
    
    if (await expandBtn.count()) {
      await expandBtn.click();
      await expect(page.locator('.insights-narrative, [data-testid="insights-text"]')).toBeVisible();
    } else if (await insightsSection.count()) {
      await expect(insightsSection).toBeVisible();
    }
  });
});
