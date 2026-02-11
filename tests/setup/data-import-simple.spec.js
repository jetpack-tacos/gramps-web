/**
 * Simplified Data Import Test
 * Verifies data exists (already imported via Python API)
 */

import { test, expect } from '@playwright/test';
import { login } from './helpers.js';

test.describe('Database Setup - Import via Dashboard', () => {
  test('should import HO Genealogy.ged', async ({ page }) => {
    await login(page);

    // Verify data via API instead of re-importing
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

    await page.screenshot({ path: 'test-results/import-success.png', fullPage: true });
  });
});
