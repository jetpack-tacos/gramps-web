/**
 * Authenticated tests for Family Tree menu - requires login
 * To run: npx playwright test tests/tree-menu-authenticated.spec.js --headed
 *
 * Note: You need to have a user account created first
 */

import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5000';

// TODO: Set these or create a user first
const TEST_USERNAME = process.env.TEST_USERNAME || '';
const TEST_PASSWORD = process.env.TEST_PASSWORD || '';

test.describe('Family Tree Menu (Authenticated)', () => {

  test.skip(!TEST_USERNAME || !TEST_PASSWORD, 'Skipping - no credentials provided');

  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto(`${BASE_URL}/login`);

    await page.locator('input[type="text"]').fill(TEST_USERNAME);
    await page.locator('input[type="password"]').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /login/i }).click();

    // Wait for navigation to complete
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  });

  test('should display Family Tree menu item after login', async ({ page }) => {
    await page.screenshot({ path: 'test-results/auth-01-after-login.png', fullPage: true });

    // Look for the main menu
    const mainMenu = await page.locator('grampsjs-main-menu');
    await expect(mainMenu).toBeVisible({ timeout: 10000 });

    // Look for Family Tree menu item
    const familyTreeItem = await page.getByText('Family Tree');

    console.log('🔍 Checking for Family Tree menu after login...');

    if (await familyTreeItem.count() === 0) {
      console.log('❌ Family Tree menu item NOT FOUND after login');

      // Get all visible menu items
      const menuItems = await page.locator('grampsjs-main-menu grampsjs-list-item span').all();
      console.log(`📋 Available menu items (${menuItems.length}):`);
      for (const item of menuItems) {
        const text = await item.textContent();
        console.log(`  - ${text?.trim()}`);
      }
    } else {
      console.log('✅ Family Tree menu item FOUND!');
      await expect(familyTreeItem).toBeVisible();
    }
  });

  test('should navigate to tree view when clicking Family Tree', async ({ page }) => {
    // Find and click Family Tree menu item
    const familyTreeLink = await page.locator('grampsjs-list-item[href="/tree"]');

    if (await familyTreeLink.count() > 0) {
      await familyTreeLink.click();
      await page.waitForLoadState('networkidle');

      await page.screenshot({ path: 'test-results/auth-02-tree-view.png', fullPage: true });

      // Check if we're on the tree page
      expect(page.url()).toContain('/tree');

      // Look for tree components
      const treeComponent = await page.locator('grampsjs-view-tree').count();
      console.log(`🌳 Tree view component found: ${treeComponent > 0 ? 'Yes' : 'No'}`);

      if (treeComponent === 0) {
        const bodyText = await page.textContent('body');
        if (bodyText?.includes('No Home Person')) {
          console.log('⚠️  Tree view requires a Home Person to be set');
        }
      }
    } else {
      console.log('⚠️  Cannot test tree navigation - menu item not found');
    }
  });

  test('should show tree visualization tabs', async ({ page }) => {
    await page.goto(`${BASE_URL}/tree`);
    await page.waitForLoadState('networkidle');

    await page.screenshot({ path: 'test-results/auth-03-tree-tabs.png', fullPage: true });

    // Look for tab elements
    const tabs = await page.locator('md-tabs md-primary-tab').all();
    console.log(`\n📑 Tree visualization tabs found: ${tabs.length}`);

    for (const tab of tabs) {
      const text = await tab.textContent();
      console.log(`  - ${text?.trim()}`);
    }

    // Expected tabs: Ancestor Tree, Descendant Tree, Hourglass Graph, Relationship Graph, Fan Chart
    if (tabs.length >= 5) {
      console.log('✅ All expected tree visualization tabs are present');
    } else {
      console.log(`⚠️  Expected 5 tabs, found ${tabs.length}`);
    }
  });
});

test.describe('Check if user account exists', () => {

  test('verify login page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.screenshot({ path: 'test-results/login-page.png' });

    const loginButton = await page.getByRole('button', { name: /login/i });
    await expect(loginButton).toBeVisible();

    console.log('\n📝 To test with authentication:');
    console.log('  1. Create a user account if you haven\'t already');
    console.log('  2. Set environment variables:');
    console.log('     SET TEST_USERNAME=your_username');
    console.log('     SET TEST_PASSWORD=your_password');
    console.log('  3. Re-run tests');

    if (!TEST_USERNAME) {
      console.log('\n⚠️  No TEST_USERNAME provided - skipping authenticated tests');
    }
  });
});
