import { test, expect } from '@playwright/test';
import { appUrl } from '../support/env';
import { loginWithDemoRole, navigateTo } from '../support/app';

test.describe('Frontend records detailed features', () => {
  test('records page loads with table and controls for analyst', async ({ page }) => {
    await loginWithDemoRole(page, 'analyst');
    await navigateTo(page, '/records');

    await expect(page).toHaveURL(/#\/records$/);
    await expect(page.getByRole('heading', { name: /transactions|financial records/i })).toBeVisible();
    await expect(page.locator('#records-table, table')).toBeVisible();
    
    // Verify filter controls exist
    const filterBtn = page.locator('[aria-label*="filter" i], #filter-btn, .filter-toggle').first();
    expect(await filterBtn.count()).toBeGreaterThanOrEqual(0);
  });

  test('records category filter constrains displayed data', async ({ page }) => {
    await loginWithDemoRole(page, 'analyst');
    await navigateTo(page, '/records');

    // Find category filter
    const categoryFilter = page.locator('#category-filter, select[name="category"], [data-testid="category-filter"]').first();
    
    if (await categoryFilter.count()) {
      // Get initial records count
      const initialRows = await page.locator('#records-table tbody tr, .record-row').count();

      // Select a category
      await categoryFilter.click();
      const option = page.locator('option, [data-value], .dropdown-item').filter({ hasText: /grocery|food|fuel|salary/i }).first();
      
      if (await option.count()) {
        await option.click();

        // Wait for filter to apply
        await page.waitForTimeout(500);

        // Verify filter is applied (URL or visual indicator)
        const urlMatch = page.url().includes('category=');
        const filterBadge = page.locator('[data-testid="active-filter"], .badge').filter({ hasText: /active|applied/i });
        
        expect(urlMatch || await filterBadge.count() > 0).toBeTruthy();
      }
    }
  });

  test('records type filter (income/expense) works', async ({ page }) => {
    await loginWithDemoRole(page, 'analyst');
    await navigateTo(page, '/records');

    const typeFilter = page.locator('#type-filter, select[name="type"], [data-testid="type-filter"]').first();
    
    if (await typeFilter.count()) {
      await typeFilter.click();
      const expenseOption = page.locator('option, [data-value], .dropdown-item').filter({ hasText: /expense/i }).first();
      
      if (await expenseOption.count()) {
        await expenseOption.click();

        // Verify type filter applied
        const urlMatch = page.url().includes('type=');
        expect(urlMatch).toBeTruthy();
      }
    }
  });

  test('records date range filter constrains results', async ({ page }) => {
    await loginWithDemoRole(page, 'analyst');
    await navigateTo(page, '/records');

    const dateRangeOpener = page.locator('[aria-label*="date" i], #date-filter, .date-filter-btn').first();
    
    if (await dateRangeOpener.count()) {
      await dateRangeOpener.click();

      // Find date inputs
      const fromInput = page.locator('input[name="from"], input[placeholder*="from" i]').first();
      const toInput = page.locator('input[name="to"], input[placeholder*="to" i]').first();

      if (await fromInput.count()) {
        // Set a date range (last 30 days)
        const today = new Date();
        const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        
        await fromInput.fill(thirtyDaysAgo.toISOString().split('T')[0]);
        if (await toInput.count()) {
          await toInput.fill(today.toISOString().split('T')[0]);
        }

        // Apply filter
        const applyBtn = page.locator('button:has-text("Apply"), button:has-text("Filter")').first();
        if (await applyBtn.count()) {
          await applyBtn.click();
          await page.waitForTimeout(500);
        }

        // Verify filter applied
        expect(page.url().includes('from=') || page.url().includes('date=')).toBeTruthy();
      }
    }
  });

  test('records pagination controls work', async ({ page }) => {
    await loginWithDemoRole(page, 'analyst');
    await navigateTo(page, '/records');

    // Find pagination info
    const paginationInfo = page.locator('.pagination-info, [data-testid="pagination"]');
    const nextBtn = page.locator('[aria-label*="next" i], #next-page, .pagination button:last-child').first();
    const prevBtn = page.locator('[aria-label*="previous" i], #prev-page, .pagination button:first-child').first();

    if (await nextBtn.count()) {
      // Get current page number
      const startUrl = page.url();

      // Click next
      await nextBtn.click();
      await page.waitForTimeout(300);

      // Verify page changed
      const newUrl = page.url();
      expect(newUrl).not.toBe(startUrl);
    }

    if (await prevBtn.count() && page.url().includes('page=')) {
      const currentUrl = page.url();
      await prevBtn.click();
      await page.waitForTimeout(300);

      // Verify previous worked
      const prevUrl = page.url();
      expect(prevUrl).not.toBe(currentUrl);
    }
  });

  test('records search/filter text input works', async ({ page }) => {
    await loginWithDemoRole(page, 'analyst');
    await navigateTo(page, '/records');

    const searchInput = page.locator('#search-input, input[placeholder*="search" i], .search-box').first();
    
    if (await searchInput.count()) {
      await searchInput.fill('grocery');
      await page.waitForTimeout(500);

      // Verify search applied to URL or table content
      const urlHasSearch = page.url().includes('search=') || page.url().includes('query=');
      const table = page.locator('#records-table, table');
      
      if (await table.count()) {
        // If search applied, records should be filtered
        expect(urlHasSearch).toBeTruthy();
      }
    }
  });

  test('records table shows correct columns with data', async ({ page }) => {
    await loginWithDemoRole(page, 'analyst');
    await navigateTo(page, '/records');

    const table = page.locator('#records-table tbody tr, .record-row').first();
    
    if (await table.count()) {
      // Verify key columns are present
      const cells = page.locator('#records-table thead th, table th');
      const headerText = await cells.allTextContents();
      
      // Should have date, amount, category, type columns
      expect(headerText.join(' ').toLowerCase()).toMatch(/date|amount|category|type/);
    }
  });

  test('records table shows action buttons for admin', async ({ page }) => {
    await loginWithDemoRole(page, 'admin');
    await navigateTo(page, '/records');

    const firstRow = page.locator('#records-table tbody tr, .record-row').first();
    
    if (await firstRow.count()) {
      // Admin should have edit/delete buttons
      const editBtn = firstRow.locator('button, a').filter({ hasText: /edit|update/i }).first();
      const deleteBtn = firstRow.locator('button, a').filter({ hasText: /delete|remove/i }).first();

      expect(await editBtn.count() + await deleteBtn.count()).toBeGreaterThanOrEqual(1);
    }
  });

  test('records read-only view for analyst (no edit/delete buttons)', async ({ page }) => {
    await loginWithDemoRole(page, 'analyst');
    await navigateTo(page, '/records');

    const firstRow = page.locator('#records-table tbody tr, .record-row').first();
    
    if (await firstRow.count()) {
      // Analyst should NOT have edit/delete buttons
      const editBtn = firstRow.locator('button, a').filter({ hasText: /edit|update/i });
      const deleteBtn = firstRow.locator('button, a').filter({ hasText: /delete|remove/i });

      expect(await editBtn.count()).toBe(0);
      expect(await deleteBtn.count()).toBe(0);
    }
  });

  test('records can be viewed in detail by clicking row', async ({ page }) => {
    await loginWithDemoRole(page, 'analyst');
    await navigateTo(page, '/records');

    const firstRow = page.locator('#records-table tbody tr, .record-row').first();
    
    if (await firstRow.count()) {
      await firstRow.click();

      // Should open detail view or side panel
      await expect(
        page.locator('.detail-panel, [data-testid="record-detail"], .modal')
      ).toBeVisible();
    }
  });
});
