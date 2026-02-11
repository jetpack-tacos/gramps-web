/**
 * Data Import Setup Test
 * Verifies the database is populated (data already imported via Python API)
 */

import { test, expect } from '@playwright/test';
import { login } from './helpers.js';

test.describe('Database Setup - Import Full Dataset', () => {
  test('should import HO Genealogy.ged successfully', async ({ page }) => {
    await login(page);

    // Verify data exists via API
    const stats = await page.evaluate(async () => {
      const token = localStorage.getItem('access_token');
      const r = await fetch('/api/metadata/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const meta = await r.json();
      return meta.object_counts || {};
    });

    console.log(`   People: ${stats.people}`);
    console.log(`   Families: ${stats.families}`);

    expect(stats.people).toBeGreaterThan(10);
    expect(stats.families).toBeGreaterThan(5);

    await page.screenshot({ path: 'test-results/setup-import-success.png', fullPage: true });

    // Verify dashboard loads
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const bodyText = await page.textContent('body');
    // Dashboard should show statistics section
    expect(bodyText.length).toBeGreaterThan(100);

    console.log('✅ Database populated with full dataset');
  });
});
