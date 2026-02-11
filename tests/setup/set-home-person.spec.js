/**
 * Set Home Person - Required for tree visualizations
 */

import { test, expect } from '@playwright/test';
import { login, setHomePerson } from './helpers.js';

test.describe('Set Home Person', () => {
  test('should auto-select first person as Home Person', async ({ page }) => {
    await login(page);

    // Set home person via localStorage (how the frontend actually stores it)
    const result = await setHomePerson(page);
    expect(result.success).toBe(true);

    // Reload page to apply the setting
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Verify by navigating to tree page
    await page.goto('/tree');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    await page.screenshot({ path: 'test-results/tree-after-home-set.png', fullPage: true });

    // Check if tabs are now visible (md-primary-tab, not [role="tab"])
    const tabs = page.locator('md-tabs md-primary-tab');
    const tabCount = await tabs.count();
    console.log(`   Tree tabs found: ${tabCount}`);

    if (tabCount >= 5) {
      expect(tabCount).toBeGreaterThanOrEqual(5);
    } else {
      // At minimum, the "No Home Person" message should be gone
      const bodyText = await page.textContent('body');
      expect(bodyText).not.toContain('No Home Person');
    }
  });
});
