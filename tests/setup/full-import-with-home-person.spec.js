/**
 * Complete Setup Test - Verify GEDCOM data imported + Home Person set
 * Data is already imported via direct Python API call (5,235 people).
 * This test verifies the state rather than re-importing.
 */

import { test, expect } from '@playwright/test';
import { login, setHomePerson } from './helpers.js';

const USERNAME = 'test-automation';
const PASSWORD = 'AutoTest2026!';

test.describe('Complete Database Setup', () => {
  test('should import full GEDCOM and set home person', async ({ page }) => {
    test.setTimeout(60000);

    // Step 1: Login
    await login(page, USERNAME, PASSWORD);

    // Step 2: Verify data exists via API
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
    expect(stats.people).toBeGreaterThan(5000);
    expect(stats.families).toBeGreaterThan(2000);

    // Step 3: Set Home Person
    const result = await setHomePerson(page);
    expect(result.success).toBe(true);

    // Step 4: Verify tree page works
    await page.goto('/tree');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    await page.screenshot({ path: 'test-results/08-tree-page.png', fullPage: true });

    const tabs = page.locator('md-tabs md-primary-tab');
    const tabCount = await tabs.count();
    console.log(`   Tree tabs: ${tabCount}`);

    if (tabCount >= 5) {
      console.log('✅ Tree tabs visible!');
    } else {
      const bodyText = await page.textContent('body');
      expect(bodyText).not.toContain('No Home Person');
    }

    console.log('\n✅ SETUP COMPLETE');
  });
});
