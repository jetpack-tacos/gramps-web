import {mkdir} from 'node:fs/promises'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

import {chromium} from '@playwright/test'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const frontendRoot = path.resolve(__dirname, '..', '..')

const outputDirArg = process.argv[2]
const outputDir = outputDirArg
  ? path.resolve(outputDirArg)
  : path.resolve(frontendRoot, '..', 'search-grounding-evidence', '2026-02-18', 'screenshots')

const defaultBaseUrl = 'http://127.0.0.1:8001'
const baseUrl = process.argv[3] || defaultBaseUrl
const harnessPath = '/tests/manual/search-grounding-qa-harness.html'

const scenarios = [
  {state: 'near_limit', viewport: {width: 1366, height: 900}, file: 'gate4_desktop_4999_of_5000.png'},
  {state: 'near_limit', viewport: {width: 390, height: 844}, file: 'gate4_mobile_4999_of_5000.png'},
  {state: 'exhausted', viewport: {width: 1366, height: 900}, file: 'gate4_desktop_5000_of_5000.png'},
  {state: 'exhausted', viewport: {width: 390, height: 844}, file: 'gate4_mobile_5000_of_5000.png'},
  {state: 'rollover_before', viewport: {width: 1366, height: 900}, file: 'gate4_desktop_rollover_before.png'},
  {state: 'rollover_after', viewport: {width: 1366, height: 900}, file: 'gate4_desktop_rollover_after.png'},
  {state: 'rollover_before', viewport: {width: 390, height: 844}, file: 'gate4_mobile_rollover_before.png'},
  {state: 'rollover_after', viewport: {width: 390, height: 844}, file: 'gate4_mobile_rollover_after.png'},
]

async function waitForServer(url, timeoutMs = 60000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(url)
      if (response.ok) {
        return
      }
    } catch {
      // server not ready yet
    }
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  throw new Error(`Timed out waiting for dev server at ${url}`)
}

async function run() {
  await mkdir(outputDir, {recursive: true})

  await waitForServer(`${baseUrl}${harnessPath}`)

  const browser = await chromium.launch({headless: true})
  try {
    const page = await browser.newPage()
    page.setDefaultTimeout(15000)
    for (const scenario of scenarios) {
      await page.setViewportSize(scenario.viewport)
      const url = `${baseUrl}${harnessPath}?state=${encodeURIComponent(scenario.state)}`
      await page.goto(url, {waitUntil: 'domcontentloaded', timeout: 15000})
      await page.waitForSelector('grampsjs-search-grounding-settings', {timeout: 15000})
      await page.waitForTimeout(800)
      const screenshotPath = path.join(outputDir, scenario.file)
      await page.screenshot({path: screenshotPath, fullPage: true})
      process.stdout.write(`Saved ${screenshotPath}\n`)
    }
  } finally {
    await browser.close()
  }
}

run().catch(error => {
  process.stderr.write(`${error.stack || error}\n`)
  process.exit(1)
})
