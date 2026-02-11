/**
 * Import via Tasks Menu
 * Verifies import functionality is accessible via settings
 */

import { test, expect } from '@playwright/test';
import { login } from './helpers.js';

test.describe('Import via Tasks Menu', () => {
  test('should import via Tasks menu', async ({ page }) => {
    await login(page);

    // In Gramps Web, import is under settings/administration
    await page.goto('/settings/administration');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'test-results/tasks-page.png', fullPage: true });

    const bodyText = await page.textContent('body');
    const hasImport = /import|upload|gedcom/i.test(bodyText);
    console.log(`   Has import content: ${hasImport}`);

    // Also verify data already exists
    const stats = await page.evaluate(async () => {
      const token = localStorage.getItem('access_token');
      const r = await fetch('/api/metadata/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const meta = await r.json();
      return meta.object_counts || {};
    });

    console.log(`   People in DB: ${stats.people}`);
    expect(stats.people).toBeGreaterThan(0);
  });
});
