/**
 * Shared test helpers for Playwright E2E tests
 * GenAI Genealogy - Full Functional Testing Suite
 */

import {expect} from '@playwright/test'
import nodePath from 'path'

// Test configuration
export const TEST_USER = {
  username: 'test-automation',
  password: 'AutoTest2026!',
  email: 'test@genai-genealogy.local',
}

export const BASE_URL = 'http://localhost:5000'

/**
 * Login helper - authenticates user and waits for dashboard
 * @param {Page} page - Playwright page object
 * @param {string} username - Username (defaults to TEST_USER)
 * @param {string} password - Password (defaults to TEST_USER)
 */
export async function login(
  page,
  username = TEST_USER.username,
  password = TEST_USER.password
) {
  console.log(`🔐 Logging in as: ${username}`)

  await page.goto('/login')

  // Wait for login form to be fully loaded (LitElement)
  await page.waitForSelector('grampsjs-login', {
    state: 'visible',
    timeout: 10000,
  })

  // Fill credentials (need to pierce shadow DOM)
  const loginComponent = page.locator('grampsjs-login')
  await loginComponent.locator('input[type="text"]').fill(username)
  await loginComponent.locator('input[type="password"]').fill(password)

  // Submit form - look for "login" button (case insensitive)
  await page.getByRole('button', {name: /login/i}).click()

  // Wait for navigation to dashboard
  await page.waitForURL('/', {timeout: 10000})

  // Wait for app to initialize - look for the main content area
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1000) // Let app components render

  console.log('✅ Login successful')
}

/**
 * Logout helper
 * @param {Page} page - Playwright page object
 */
export async function logout(page) {
  console.log('🚪 Logging out')

  // Open user menu
  await page.click('[aria-label="User menu"]')

  // Click logout
  await page.click('text=Sign out')

  // Verify redirected to login
  await page.waitForURL('/login', {timeout: 5000})

  console.log('✅ Logout successful')
}

/**
 * Wait for LitElement component to finish rendering
 * @param {Page} page - Playwright page object
 * @param {string} tagName - Component tag name (e.g., 'grampsjs-person-form')
 * @param {number} timeout - Timeout in milliseconds
 */
export async function waitForComponent(page, tagName, timeout = 10000) {
  console.log(`⏳ Waiting for component: ${tagName}`)

  await page.waitForSelector(tagName, {state: 'visible', timeout})

  // Wait for LitElement's updateComplete promise
  await page.evaluate(tag => {
    const component = document.querySelector(tag)
    return component?.updateComplete || Promise.resolve()
  }, tagName)

  console.log(`✅ Component ready: ${tagName}`)
}

/**
 * Wait for D3 chart to finish rendering
 * @param {Page} page - Playwright page object
 * @param {string} svgSelector - SVG selector (default 'svg')
 * @param {number} minElements - Minimum number of child elements expected
 */
export async function waitForD3Render(
  page,
  svgSelector = 'svg',
  minElements = 5
) {
  console.log(`📊 Waiting for D3 chart to render: ${svgSelector}`)

  await page.waitForSelector(svgSelector, {state: 'visible', timeout: 15000})

  // Wait for D3 animations to settle (typically 300-500ms)
  await page.waitForTimeout(600)

  // Verify chart has content
  await page.waitForFunction(
    ({selector, min}) => {
      const svg = document.querySelector(selector)
      if (!svg) return false
      const elements = svg.querySelectorAll('g, circle, rect, path, line')
      return elements.length >= min
    },
    {selector: svgSelector, min: minElements},
    {timeout: 10000}
  )

  console.log(`✅ D3 chart rendered: ${svgSelector}`)
}

/**
 * Upload GEDCOM file via the import UI
 * @param {Page} page - Playwright page object
 * @param {string} filePath - Absolute path to .ged file
 */
export async function uploadGedcom(page, filePath) {
  console.log(`📤 Uploading GEDCOM: ${nodePath.basename(filePath)}`)

  await page.goto('/import')
  await waitForComponent(page, 'grampsjs-view-import')

  // Find the file input (may be in shadow DOM)
  const input = page.locator('input[type="file"]')
  await input.setInputFiles(filePath)

  // Click upload button
  await page.click('button:has-text("Upload"), button:has-text("Import")')

  // Wait for success message (Celery task may take time)
  await page.waitForSelector('text=/Import.*successful/i', {timeout: 120000})

  console.log('✅ GEDCOM import completed')

  // Return import stats if visible
  const statsText = await page.textContent('body').catch(() => '')
  const peopleMatch = statsText.match(/(\d+)\s+people/i)
  const familiesMatch = statsText.match(/(\d+)\s+families/i)

  return {
    people: peopleMatch ? parseInt(peopleMatch[1], 10) : 0,
    families: familiesMatch ? parseInt(familiesMatch[1], 10) : 0,
  }
}

/**
 * Create test user via registration UI (if not exists)
 * @param {Page} page - Playwright page object
 */
export async function ensureTestUser(page) {
  console.log('👤 Ensuring test user exists')

  await page.goto('/register')

  // Check if registration is available
  const registerComponent = await page.locator('grampsjs-register').count()

  if (registerComponent === 0) {
    console.log('ℹ️  Registration disabled or user already exists')
    return
  }

  // Try to register
  try {
    await registerComponent
      .locator('input[name="username"]')
      .fill(TEST_USER.username)
    await registerComponent.locator('input[type="email"]').fill(TEST_USER.email)
    await registerComponent
      .locator('input[type="password"]')
      .first()
      .fill(TEST_USER.password)
    await registerComponent
      .locator('input[type="password"]')
      .last()
      .fill(TEST_USER.password)

    await registerComponent.locator('button[type="submit"]').click()

    // Wait for success or error
    await page.waitForTimeout(2000)

    const url = page.url()
    if (url.includes('/login') || url === `${BASE_URL}/`) {
      console.log('✅ Test user created')
    } else {
      console.log('ℹ️  Test user may already exist')
    }
  } catch (error) {
    console.log(
      'ℹ️  Could not create test user (may already exist):',
      error.message
    )
  }
}

/**
 * Navigate and wait for page to be ready
 * @param {Page} page - Playwright page object
 * @param {string} path - Path to navigate to
 */
export async function navigateAndWait(page, path) {
  console.log(`🧭 Navigating to: ${path}`)

  await page.goto(path)
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(500) // Let LitElement components initialize

  console.log(`✅ Page ready: ${path}`)
}

/**
 * Take screenshot with descriptive name
 * @param {Page} page - Playwright page object
 * @param {string} name - Screenshot name (without extension)
 */
export async function takeScreenshot(page, name) {
  const filename = `test-results/${name.replace(/\s+/g, '-').toLowerCase()}.png`
  await page.screenshot({path: filename, fullPage: true})
  console.log(`📸 Screenshot saved: ${filename}`)
}

/**
 * Wait for API request to complete
 * @param {Page} page - Playwright page object
 * @param {string} urlPattern - URL pattern to match (can be partial)
 * @param {Function} action - Action that triggers the request
 */
export async function waitForApiRequest(page, urlPattern, action) {
  const responsePromise = page.waitForResponse(
    response =>
      response.url().includes(urlPattern) && response.status() === 200,
    {timeout: 15000}
  )

  await action()

  const response = await responsePromise
  return response.json()
}

/**
 * Check for console errors
 * @param {Page} page - Playwright page object
 * @returns {Array} Array of error messages
 */
export async function collectConsoleErrors(page) {
  const errors = []

  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text())
    }
  })

  page.on('pageerror', error => {
    errors.push(`Page Error: ${error.message}`)
  })

  return errors
}

/**
 * Fill form field in shadow DOM
 * @param {Page} page - Playwright page object
 * @param {string} componentSelector - Component selector
 * @param {string} fieldSelector - Field selector within component
 * @param {string} value - Value to fill
 */
export async function fillShadowField(
  page,
  componentSelector,
  fieldSelector,
  value
) {
  const component = page.locator(componentSelector)
  await component.locator(fieldSelector).fill(value)
}

/**
 * Click button in shadow DOM
 * @param {Page} page - Playwright page object
 * @param {string} componentSelector - Component selector
 * @param {string} buttonText - Button text or label
 */
export async function clickShadowButton(page, componentSelector, buttonText) {
  const component = page.locator(componentSelector)
  await component.locator(`button:has-text("${buttonText}")`).click()
}

/**
 * Get all visible menu items
 * @param {Page} page - Playwright page object
 * @returns {Promise<Array>} Array of {text, href} objects
 */
export async function getMenuItems(page) {
  const menuItems = await page
    .locator('grampsjs-main-menu grampsjs-list-item')
    .all()

  return Promise.all(
    menuItems.map(async item => {
      const text = await item.textContent()
      const href = await item.getAttribute('href')
      return {text: text?.trim(), href}
    })
  )
}

/**
 * Wait for Celery task to complete (for long operations)
 * @param {Page} page - Playwright page object
 * @param {number} timeout - Maximum wait time in milliseconds
 */
export async function waitForCeleryTask(page, timeout = 120000) {
  console.log('⏳ Waiting for Celery task to complete...')

  // Look for progress indicators
  const progressBar = page.locator('mwc-linear-progress, .progress-bar')

  if ((await progressBar.count()) > 0) {
    await progressBar.waitFor({state: 'hidden', timeout})
  }

  // Wait for success or error message
  await page.waitForSelector('text=/success|complete|error|failed/i', {timeout})

  console.log('✅ Celery task completed')
}

/**
 * Get person data from API (helper for verification)
 * @param {Page} page - Playwright page object
 * @param {string} personId - Person gramps_id or handle
 */
export async function getPersonFromApi(page, personId) {
  const response = await page.evaluate(async id => {
    const token = localStorage.getItem('access_token')
    const res = await fetch(`/api/people?gramps_id=${id}`, {
      headers: {Authorization: `Bearer ${token}`},
    })
    return res.json()
  }, personId)

  return response[0] // API returns array
}

/**
 * Assert element has CSS class
 * @param {Locator} locator - Playwright locator
 * @param {string} className - CSS class name
 */
export async function expectHasClass(locator, className) {
  const classes = await locator.getAttribute('class')
  expect(classes).toContain(className)
}

/**
 * Assert element has CSS variable value
 * @param {Page} page - Playwright page object
 * @param {string} selector - Element selector
 * @param {string} varName - CSS variable name (e.g., '--primary-color')
 * @param {string} expectedValue - Expected value
 */
export async function expectCssVariable(
  page,
  selector,
  varName,
  expectedValue
) {
  const value = await page.evaluate(
    ({sel, variable}) => {
      const el = document.querySelector(sel)
      return getComputedStyle(el).getPropertyValue(variable).trim()
    },
    {sel: selector, variable: varName}
  )

  expect(value).toBe(expectedValue)
}

/**
 * Set Home Person in localStorage (how the frontend stores it)
 * This enables tree visualizations which require a home person.
 * Must be called AFTER login (needs valid JWT to extract tree ID).
 * @param {Page} page - Playwright page object
 * @param {string} grampsId - The gramps_id of the person to set as home (default: first person)
 */
export async function setHomePerson(page, grampsId = null) {
  console.log('🏠 Setting Home Person...')

  const result = await page.evaluate(async requestedGrampsId => {
    // Get tree ID from JWT
    const accessToken = localStorage.getItem('access_token')
    if (!accessToken) return {success: false, error: 'No access token'}

    let treeId
    try {
      const payload = JSON.parse(atob(accessToken.split('.')[1]))
      treeId = payload.tree
    } catch (e) {
      return {success: false, error: 'Failed to decode JWT'}
    }
    if (!treeId) return {success: false, error: 'No tree ID in JWT'}

    // If no grampsId provided, fetch first person from API
    let gid = requestedGrampsId
    if (!gid) {
      try {
        const response = await fetch(
          '/api/people/?page=1&pagesize=1&keys=gramps_id',
          {
            headers: {Authorization: `Bearer ${accessToken}`},
          }
        )
        const people = await response.json()
        if (Array.isArray(people) && people.length > 0) {
          gid = people[0].gramps_id
        } else {
          return {success: false, error: 'No people found in database'}
        }
      } catch (e) {
        return {success: false, error: `API error: ${e.message}`}
      }
    }

    // Set in localStorage (how the frontend stores home person)
    const settingsKey = 'grampsjs_settings_tree'
    let settings = {}
    try {
      const existing = localStorage.getItem(settingsKey)
      if (existing) settings = JSON.parse(existing)
    } catch (e) {
      /* ignore parse errors */
    }

    if (!settings[treeId]) settings[treeId] = {}
    settings[treeId].homePerson = gid
    localStorage.setItem(settingsKey, JSON.stringify(settings))

    return {success: true, grampsId: gid, treeId}
  }, grampsId)

  if (result.success) {
    console.log(
      `✅ Home Person set to ${result.grampsId} (tree: ${result.treeId})`
    )
  } else {
    console.log(`❌ Failed to set Home Person: ${result.error}`)
  }

  return result
}

/**
 * Wait for table data to load in list views (people, families, etc.)
 * The app uses <table class="linked"> with <tr> rows for list items.
 * @param {Page} page - Playwright page object
 * @param {string} viewTag - View component tag (e.g., 'grampsjs-view-people')
 * @param {number} timeout - Timeout in milliseconds
 * @returns {number} Number of data rows found
 */
export async function waitForTableData(page, viewTag, timeout = 15000) {
  console.log(`⏳ Waiting for table data in ${viewTag}...`)

  // Wait for the view component to exist
  await page.waitForSelector(viewTag, {state: 'visible', timeout})

  // Wait for API data to load and table to render
  // The component fetches data on activate, which populates table rows
  await page.waitForTimeout(3000)

  // Count rows in the table (shadow DOM)
  const rowCount = await page.evaluate(tag => {
    const view = document.querySelector(tag)
    if (!view || !view.shadowRoot) return 0
    const table = view.shadowRoot.querySelector('table.linked')
    if (!table) return 0
    // Subtract 1 for header row
    return Math.max(0, table.querySelectorAll('tr').length - 1)
  }, viewTag)

  console.log(`✅ Table data loaded in ${viewTag}: ${rowCount} rows`)
  return rowCount
}

// Export all helpers as default object
export default {
  TEST_USER,
  BASE_URL,
  login,
  logout,
  waitForComponent,
  waitForD3Render,
  uploadGedcom,
  ensureTestUser,
  navigateAndWait,
  takeScreenshot,
  waitForApiRequest,
  collectConsoleErrors,
  fillShadowField,
  clickShadowButton,
  getMenuItems,
  waitForCeleryTask,
  getPersonFromApi,
  expectHasClass,
  expectCssVariable,
  setHomePerson,
  waitForTableData,
}
