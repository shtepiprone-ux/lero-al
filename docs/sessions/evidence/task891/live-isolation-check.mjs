// Task 891 R15/AC12 — live two-agent isolation re-run on the final tree, against the dev server
// on http://localhost:3001. Reuses the real HYDRATION_AGENT1/AGENT2 accounts and their real
// listings from Task 854's own Pass 3 (docs/sessions/2026-09-27-task854-agent-statistics-page.md).
import fs from 'node:fs'
import { chromium } from 'playwright'

// dotenv truncates at an unquoted `#` (treats it as a comment) — these passwords contain one, so
// read the raw lines directly instead of trusting dotenv's parse for just these two values.
function rawEnvValue(varName) {
  const raw = fs.readFileSync('.env.local', 'utf8')
  const line = raw.split(/\r?\n/).find((l) => l.startsWith(`${varName}=`))
  if (!line) throw new Error(`${varName} not found in .env.local`)
  return line.slice(varName.length + 1)
}

const AGENT1_EMAIL = rawEnvValue('HYDRATION_AGENT1_EMAIL')
const AGENT1_PASSWORD = rawEnvValue('HYDRATION_AGENT1_PASSWORD')
const AGENT2_EMAIL = rawEnvValue('HYDRATION_AGENT2_EMAIL')
const AGENT2_PASSWORD = rawEnvValue('HYDRATION_AGENT2_PASSWORD')

const BASE = 'http://localhost:3001'
const browser = await chromium.launch()

async function loginAndVisit(email, password, label) {
  const context = await browser.newContext()
  const page = await context.newPage()
  await page.goto(`${BASE}/en/auth/login`, { waitUntil: 'networkidle' })
  await page.locator('#login-email').fill(email)
  await page.locator('#login-password').fill(password)
  await page.locator('button[type="submit"]', { hasText: 'Login' }).click()
  await page.waitForResponse((r) => r.url().includes('/auth/') || r.url().includes('token'), { timeout: 15000 }).catch(() => {})
  await page.waitForTimeout(2500)

  await page.goto(`${BASE}/en/cabinet/statistics`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1000)
  const url = page.url()
  const heroValue = await page.locator('text=Visible now').locator('..').locator('..').textContent().catch(() => null)
  const rows = await page.locator('table tbody tr').count().catch(() => 0)
  const titles = await page.locator('table tbody tr td:first-child a').allTextContents().catch(() => [])
  await page.screenshot({ path: `docs/sessions/evidence/task891/live-${label}.png`, fullPage: true }).catch(() => {})
  return { context, page, url, heroValue, rows, titles }
}

const agent1 = await loginAndVisit(AGENT1_EMAIL, AGENT1_PASSWORD, 'agent1')
console.log('AGENT1:', JSON.stringify({ url: agent1.url, rows: agent1.rows, titles: agent1.titles }, null, 2))

const agent2 = await loginAndVisit(AGENT2_EMAIL, AGENT2_PASSWORD, 'agent2')
console.log('AGENT2:', JSON.stringify({ url: agent2.url, rows: agent2.rows, titles: agent2.titles }, null, 2))

// Cross-owner tampering: Agent1's session, Agent2's real listing slug pasted into status & sort.
const agent2Slug = agent2.titles[0] ? await agent2.page.locator('table tbody tr td:first-child a').first().getAttribute('href') : null
console.log('AGENT2 slug href:', agent2Slug)

await agent1.page.goto(`${BASE}/en/cabinet/statistics?status=${encodeURIComponent(agent2Slug ?? 'unknown')}&sort=${encodeURIComponent(agent2Slug ?? 'unknown')}`, { waitUntil: 'networkidle' })
await agent1.page.waitForTimeout(1000)
const tamperedTitles = await agent1.page.locator('table tbody tr td:first-child a').allTextContents().catch(() => [])
const tamperedRows = await agent1.page.locator('table tbody tr').count().catch(() => 0)
await agent1.page.screenshot({ path: 'docs/sessions/evidence/task891/live-agent1-tampered.png', fullPage: true }).catch(() => {})
console.log('AGENT1 TAMPERED:', JSON.stringify({ rows: tamperedRows, titles: tamperedTitles }, null, 2))

// status=sold with no sold listings — filtered-empty text (854 R11 preserved).
await agent1.page.goto(`${BASE}/en/cabinet/statistics?status=sold`, { waitUntil: 'networkidle' })
await agent1.page.waitForTimeout(1000)
const filteredEmptyText = await agent1.page.locator('body').textContent()
console.log('AGENT1 status=sold contains "No listings match these filters":', filteredEmptyText.includes('No listings match these filters'))

await browser.close()
console.log('DONE')
