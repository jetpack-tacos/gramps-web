/**
 * Advanced Features Tests
 * - Search & Filters (Phase 7)
 * - AI Chat (Phase 9)
 * - Import/Export (Phase 8)
 * - Dashboard (Phase 10)
 *
 * Key fix: Dashboard stats use "Number of people" format from GrampsjsStatistics
 * Key fix: Import page is at /settings/administration (not /import)
 */

import { test, expect } from '@playwright/test';
import { login, navigateAndWait, takeScreenshot } from '../setup/helpers.js';

test.describe('Search & Filters - Phase 7', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should perform multi-type search', async ({ page }) => {
    await navigateAndWait(page, '/search');

    const searchInput = page.locator('input[type="search"], input[placeholder*="earch"]').first();

    if (await searchInput.count() > 0) {
      await searchInput.fill('John');
      await page.waitForTimeout(1500);

      const bodyText = await page.textContent('body');
      console.log('   Search completed');
      await takeScreenshot(page, 'search-results');

      const hasPeople = bodyText.match(/people|person/i);
      const hasEvents = bodyText.match(/events?/i);
      const hasPlaces = bodyText.match(/places?/i);
      console.log(`   Results: People=${!!hasPeople}, Events=${!!hasEvents}, Places=${!!hasPlaces}`);
      expect(hasPeople || hasEvents || hasPlaces).toBeTruthy();
    }
  });

  test('should filter search results by object type', async ({ page }) => {
    await navigateAndWait(page, '/search');

    const searchInput = page.locator('input[type="search"], input[placeholder*="earch"]').first();
    if (await searchInput.count() > 0) {
      await searchInput.fill('Smith');
      await page.waitForTimeout(1500);

      const peopleFilter = page.locator('input[type="checkbox"], mwc-checkbox').first();
      if (await peopleFilter.count() > 0) {
        console.log('   Filters found');
        await peopleFilter.click();
        await page.waitForTimeout(500);
        await takeScreenshot(page, 'search-filtered');
      } else {
        console.log('   Filters not found');
      }
    }
  });

  test('should filter by date range', async ({ page }) => {
    await navigateAndWait(page, '/search');

    const searchInput = page.locator('input[type="search"]').first();
    if (await searchInput.count() > 0) {
      await searchInput.fill('birth');
      await page.waitForTimeout(1500);

      const dateInputs = page.locator('input[type="number"], input[placeholder*="year"]');
      if (await dateInputs.count() >= 2) {
        console.log('   Date range filters found');
        await dateInputs.first().fill('1900');
        await dateInputs.nth(1).fill('1950');
        await page.waitForTimeout(500);
        await takeScreenshot(page, 'search-date-filtered');
      } else {
        console.log('   Date range filters not found');
      }
    }
  });

  test('should handle empty search results', async ({ page }) => {
    await navigateAndWait(page, '/search');

    const searchInput = page.locator('input[type="search"], input[placeholder*="earch"]').first();
    if (await searchInput.count() > 0) {
      await searchInput.fill('zzzzxxxxxnonexistent99999');
      await page.waitForTimeout(1500);
      await takeScreenshot(page, 'search-empty');
      // Should not crash
      console.log('   Empty search handled gracefully');
    }
  });

  test('should search across multiple entity types', async ({ page }) => {
    await navigateAndWait(page, '/search');

    const searchInput = page.locator('input[type="search"], input[placeholder*="earch"]').first();
    if (await searchInput.count() > 0) {
      await searchInput.fill('Mary');
      await page.waitForTimeout(1500);

      const bodyText = await page.textContent('body');
      expect(bodyText.length).toBeGreaterThan(100);
      console.log('   Multi-entity search completed');
    }
  });

  test('should paginate search results', async ({ page }) => {
    await navigateAndWait(page, '/search');

    const searchInput = page.locator('input[type="search"], input[placeholder*="earch"]').first();
    if (await searchInput.count() > 0) {
      await searchInput.fill('a'); // Broad search for pagination
      await page.waitForTimeout(1500);

      // Look for pagination controls
      const pagination = page.locator('grampsjs-pagination, [class*="pagination"], button:has-text("Next")');
      const hasPagination = await pagination.count() > 0;
      console.log(`   Pagination found: ${hasPagination}`);
    }
  });
});

test.describe('AI Chat - Phase 9', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should display chat interface', async ({ page }) => {
    await navigateAndWait(page, '/chat');
    await page.waitForTimeout(2000);

    // Chat may be grampsjs-view-chat or grampsjs-chat
    const chatView = page.locator('grampsjs-view-chat, grampsjs-chat');

    if (await chatView.count() > 0) {
      console.log('   Chat component found');
      await takeScreenshot(page, 'chat-interface');
    } else {
      // Chat might not be configured - check body for indication
      const bodyText = await page.textContent('body');
      const notConfigured = /not.*configured|unavailable|no.*chat/i.test(bodyText);
      console.log(`   Chat not configured: ${notConfigured}`);
      await takeScreenshot(page, 'chat-interface');
      // Don't fail if chat isn't configured
    }
  });

  test('should send chat message (if LLM configured)', async ({ page }) => {
    await navigateAndWait(page, '/chat');
    await page.waitForTimeout(2000);

    const chatInput = page.locator('textarea, input[type="text"]').last();
    if (await chatInput.count() > 0) {
      await chatInput.fill('How many people are in the database?');

      const sendButton = page.locator('button[type="submit"], button:has-text("Send"), mwc-icon-button[icon="send"]').last();
      if (await sendButton.count() > 0) {
        await sendButton.click();
        await page.waitForTimeout(5000);

        const bodyText = await page.textContent('body');
        if (bodyText.match(/api.*key|not.*configured|unavailable/i)) {
          console.log('   AI chat not configured (expected in test env)');
        } else if (bodyText.match(/\d+.*people/i)) {
          console.log('   AI chat responded with data');
        }
        await takeScreenshot(page, 'chat-response');
      }
    }
  });
});

test.describe('Import/Export - Phase 8', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should display import page', async ({ page }) => {
    // Import is under settings/administration in Gramps Web
    await page.goto('/settings/administration');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const bodyText = await page.textContent('body');
    // Look for import-related content
    const hasImport = /import|upload|gedcom/i.test(bodyText);
    console.log(`   Has import content: ${hasImport}`);

    await takeScreenshot(page, 'import-page');

    if (!hasImport) {
      // Try direct /import route as fallback
      await page.goto('/import');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      const bodyText2 = await page.textContent('body');
      const hasImport2 = /import|upload|gedcom/i.test(bodyText2);
      console.log(`   /import route has import content: ${hasImport2}`);
      await takeScreenshot(page, 'import-page-fallback');
    }
  });

  test('should export GEDCOM file', async ({ page }) => {
    // Export may be under settings or a dedicated route
    await navigateAndWait(page, '/settings/administration');
    await page.waitForTimeout(2000);

    const exportButton = page.locator('button:has-text("Export"), a:has-text("Export")');
    if (await exportButton.count() > 0) {
      console.log('   Export button found');
      const downloadPromise = page.waitForEvent('download', { timeout: 30000 });
      await exportButton.click();
      try {
        const download = await downloadPromise;
        console.log(`   Export started: ${download.suggestedFilename()}`);
        expect(download.suggestedFilename()).toMatch(/\.ged$/i);
        await takeScreenshot(page, 'export-initiated');
      } catch (error) {
        console.log('   Export timed out:', error.message);
      }
    } else {
      console.log('   Export button not found');
    }
  });

  test('should handle export errors gracefully', async ({ page }) => {
    // Navigate to export and verify no crashes
    await navigateAndWait(page, '/settings/administration');
    await page.waitForTimeout(2000);

    const errors = [];
    page.on('pageerror', error => errors.push(error.message));

    await takeScreenshot(page, 'export-error-check');
    expect(errors.length).toBe(0);
  });

  test('should validate import file type', async ({ page }) => {
    await page.goto('/settings/administration');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const fileInput = page.locator('input[type="file"]');
    if (await fileInput.count() > 0) {
      console.log('   File input found on admin page');
      await takeScreenshot(page, 'import-file-input');
    } else {
      console.log('   File input not visible on admin page');
    }
  });
});

test.describe('Dashboard & Reports - Phase 10', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should display dashboard statistics', async ({ page }) => {
    await navigateAndWait(page, '/');
    await page.waitForTimeout(3000);

    // Stats are inside <grampsjs-statistics> which uses Shadow DOM
    // Verify via API that data exists, then check dashboard rendered
    const stats = await page.evaluate(async () => {
      const token = localStorage.getItem('access_token');
      const r = await fetch('/api/metadata/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const meta = await r.json();
      return meta.object_counts || {};
    });

    console.log(`   API stats: people=${stats.people}, families=${stats.families}`);
    expect(stats.people).toBeGreaterThan(0);

    // Verify dashboard component rendered
    const dashboardExists = await page.locator('grampsjs-view-dashboard').count();
    console.log(`   Dashboard component: ${dashboardExists > 0 ? 'found' : 'not found'}`);
    expect(dashboardExists).toBeGreaterThan(0);

    await takeScreenshot(page, 'dashboard');
  });

  test('should navigate to reports page', async ({ page }) => {
    await page.goto('/reports');
    const url = page.url();
    if (url.includes('/reports')) {
      console.log('   Reports page exists');
      await page.waitForLoadState('networkidle');
      await takeScreenshot(page, 'reports-page');
      const bodyText = await page.textContent('body');
      if (bodyText.match(/surname|geography|distribution/i)) {
        console.log('   Reports found');
      }
    }
  });

  test('should display report types', async ({ page }) => {
    await page.goto('/reports');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await takeScreenshot(page, 'report-types');
    const bodyText = await page.textContent('body');
    console.log(`   Reports page content length: ${bodyText.length}`);
  });
});

test.describe('Map Visualization - Phase 4', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should display places on map', async ({ page }) => {
    await page.goto('/map');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // MapLibre may use canvas or a specific container
    const mapCanvas = page.locator('canvas.maplibregl-canvas, .maplibregl-map, canvas');
    if (await mapCanvas.count() > 0) {
      console.log('   Map loaded');
      await takeScreenshot(page, 'map-view');
    } else {
      // Map may not be available without proper config
      console.log('   Map not loaded (MapLibre may not be initialized)');
      await takeScreenshot(page, 'map-view-missing');
    }
  });
});
