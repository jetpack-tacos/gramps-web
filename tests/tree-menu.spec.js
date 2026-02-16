/**
 * Automated tests for Family Tree menu visibility and functionality
 * Run with: npx playwright test tests/tree-menu.spec.js --headed
 */

import {test, expect} from '@playwright/test'

const BASE_URL = 'http://localhost:5000'

test.describe('Family Tree Menu and Navigation', () => {
  test.beforeEach(async ({page}) => {
    // Navigate to the application
    await page.goto(BASE_URL)

    // Take screenshot of initial state
    await page.screenshot({
      path: 'test-results/01-initial-load.png',
      fullPage: true,
    })
  })

  test('should display the Family Tree menu item', async ({page}) => {
    // Wait for the page to load
    await page.waitForLoadState('networkidle')

    // Check if we're on a login page
    const loginForm = await page.locator('grampsjs-login').count()

    if (loginForm > 0) {
      console.log('❌ Login required - need credentials to test further')
      await page.screenshot({path: 'test-results/02-login-page.png'})

      // Try to find login fields
      const usernameField = await page
        .locator('input[type="text"], input[name="username"]')
        .first()
      const passwordField = await page.locator('input[type="password"]').first()

      if (
        (await usernameField.isVisible()) &&
        (await passwordField.isVisible())
      ) {
        console.log(
          'ℹ️  Login fields found. Add credentials to .env to automate login.'
        )
      }

      return // Skip rest of test if login required
    }

    // Look for the main menu
    await page.screenshot({
      path: 'test-results/03-after-load.png',
      fullPage: true,
    })

    // Check for grampsjs-main-menu component
    const mainMenu = await page.locator('grampsjs-main-menu')
    await expect(mainMenu).toBeVisible({timeout: 10000})

    // Look for Family Tree menu item
    const familyTreeLink = await page.locator(
      'a[href="/tree"], grampsjs-list-item[href="/tree"]'
    )
    const familyTreeText = await page.getByText('Family Tree')

    console.log('🔍 Checking for Family Tree menu...')

    const linkCount = await familyTreeLink.count()
    const textCount = await familyTreeText.count()

    console.log(`  - Links with href="/tree": ${linkCount}`)
    console.log(`  - Elements containing "Family Tree": ${textCount}`)

    if (linkCount === 0 && textCount === 0) {
      console.log('❌ ISSUE FOUND: Family Tree menu item is NOT visible')

      // Take screenshot of the menu area
      await page.screenshot({path: 'test-results/04-menu-without-tree.png'})

      // Get all menu items to see what IS showing
      const allMenuItems = await page
        .locator('grampsjs-main-menu grampsjs-list-item')
        .all()
      console.log(`  - Total menu items visible: ${allMenuItems.length}`)

      const menuItemDetails = await Promise.all(
        allMenuItems.map(async (item, index) => {
          const text = await item.textContent()
          const href = await item.getAttribute('href')
          return `    ${index + 1}. "${text?.trim()}" -> ${href}`
        })
      )
      menuItemDetails.forEach(detail => console.log(detail))
    } else {
      console.log('✅ Family Tree menu item found!')
      await expect(familyTreeLink.or(familyTreeText)).toBeVisible()
    }
  })

  test('should navigate to /tree directly', async ({page}) => {
    // Try to navigate directly to the tree view
    await page.goto(`${BASE_URL}/tree`)
    await page.waitForLoadState('networkidle')

    await page.screenshot({
      path: 'test-results/05-tree-direct-navigation.png',
      fullPage: true,
    })

    // Check if we landed on the tree page or got redirected
    const currentUrl = page.url()
    console.log(`📍 Current URL after navigating to /tree: ${currentUrl}`)

    if (currentUrl.includes('/tree')) {
      console.log('✅ Successfully navigated to /tree')

      // Look for tree-specific components
      const treeView = await page.locator('grampsjs-view-tree').count()
      const treeChart = await page
        .locator(
          'grampsjs-tree-chart, grampsjs-fan-chart, grampsjs-relationship-chart'
        )
        .count()

      console.log(`  - grampsjs-view-tree components: ${treeView}`)
      console.log(`  - Chart components: ${treeChart}`)

      if (treeView === 0 && treeChart === 0) {
        console.log('⚠️  Tree page loaded but no tree components found')

        // Check for error messages
        const pageText = await page.textContent('body')
        if (pageText.includes('No Home Person')) {
          console.log(
            'ℹ️  Issue: No Home Person set - this is required for tree view'
          )
        }
      }
    } else {
      console.log(`❌ Redirected away from /tree to: ${currentUrl}`)
    }
  })

  test('should check for JavaScript errors', async ({page}) => {
    const errors = []
    const warnings = []

    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      } else if (msg.type() === 'warning') {
        warnings.push(msg.text())
      }
    })

    page.on('pageerror', error => {
      errors.push(`Page Error: ${error.message}`)
    })

    await page.goto(BASE_URL)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000) // Wait a bit for any delayed errors

    console.log('\n📋 Console Errors:')
    if (errors.length === 0) {
      console.log('  ✅ No errors found')
    } else {
      errors.forEach((err, i) => {
        console.log(`  ${i + 1}. ${err}`)
      })
    }

    console.log('\n⚠️  Console Warnings:')
    if (warnings.length === 0) {
      console.log('  ✅ No warnings')
    } else {
      warnings.slice(0, 5).forEach((warn, i) => {
        console.log(`  ${i + 1}. ${warn}`)
      })
      if (warnings.length > 5) {
        console.log(`  ... and ${warnings.length - 5} more`)
      }
    }
  })

  test('should check which build is running', async ({page}) => {
    await page.goto(BASE_URL)

    // Look for script tags to understand which build is loaded
    const scripts = await page.locator('script[src]').all()
    console.log('\n📦 Loaded Scripts:')
    const scriptSources = await Promise.all(
      scripts.slice(0, 10).map(script => script.getAttribute('src'))
    )
    scriptSources.forEach(src => console.log(`  - ${src}`))

    // Check if service worker is registered
    const swRegistered = await page.evaluate(() => 'serviceWorker' in navigator)
    console.log(`\n🔧 Service Worker support: ${swRegistered}`)
  })
})

test.describe('Home Person Configuration', () => {
  test('should check for Home Person setting', async ({page}) => {
    await page.goto(BASE_URL)
    await page.waitForLoadState('networkidle')

    // Look for Home Person component on dashboard
    const homePersonComponent = await page
      .locator('grampsjs-home-person')
      .count()
    console.log(
      `\n🏠 Home Person component found: ${
        homePersonComponent > 0 ? 'Yes' : 'No'
      }`
    )

    if (homePersonComponent > 0) {
      const homePersonText = await page
        .locator('grampsjs-home-person')
        .textContent()
      console.log(`   Content: ${homePersonText?.trim().substring(0, 100)}`)

      if (
        homePersonText?.includes('Set') ||
        homePersonText?.includes('No Home Person')
      ) {
        console.log(
          '   ⚠️  Home Person is NOT set - this may prevent tree view from working'
        )
      } else {
        console.log('   ✅ Home Person appears to be configured')
      }
    }

    await page.screenshot({
      path: 'test-results/06-home-person-check.png',
      fullPage: true,
    })
  })
})
