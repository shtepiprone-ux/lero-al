// Task 923 Review 65 (Opus, 2026-10-29): read-only route probe on the owner's running dev server, after the owner's report that a created user's city is not shown.
// Signed in as HYDRATION_ADMIN, it opens the admin profile of the account the owner created (id as argument) and reports whether the stored city's name
// ("Adriatik - Durrës", location 151) is on the page, in view mode. Page visits only. Reads .env.local itself and prints no secret.
// Usage (repository root): node docs/sessions/evidence/task923/review-65/rv65-25-city-probe.mjs <user id>
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'

const root = process.cwd()
const require = createRequire(path.join(root, 'package.json'))
const { chromium } = require('playwright')
const env = Object.fromEntries(fs.readFileSync(path.join(root, '.env.local'), 'utf8').split(/\r?\n/).filter((l) => /^[A-Z0-9_]+=/.test(l))
  .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).replace(/^"|"$/g, '')]))
const BASE = 'http://localhost:3000'
const id = process.argv[2]
const CITY = 'Adriatik'
console.log(`platform ${process.platform} ${process.arch}; node ${process.version}; cwd ${root}; command: node docs/sessions/evidence/task923/review-65/rv65-25-city-probe.mjs ${id}`)

const browser = await chromium.launch()
const page = await (await browser.newContext()).newPage()
await page.goto(`${BASE}/uk/auth/login`, { waitUntil: 'networkidle', timeout: 180000 })
await page.fill('input[type="email"]', env.HYDRATION_ADMIN_EMAIL).catch(() => null)
await page.fill('input[type="password"]', env.HYDRATION_ADMIN_PASSWORD).catch(() => null)
await Promise.all([page.waitForURL((u) => !/\/auth\/login/.test(String(u)), { timeout: 60000 }).catch(() => null), page.click('button[type="submit"]').catch(() => null)])
const me = await page.request.get(`${BASE}/api/auth/me`)
console.log(`admin signed in: /api/auth/me ${me.status()}`)
const res = await page.goto(`${BASE}/admin/users/${id}`, { waitUntil: 'networkidle', timeout: 180000 })
const url = new URL(page.url())
const section = page.locator('#section-location')
const sectionText = (await section.count()) ? (await section.innerText()).replace(/\s+/g, ' ').trim() : null
console.log(`page ${res?.status()} ${url.pathname}`)
console.log(`location section text: ${JSON.stringify(sectionText)}`)
console.log(`stored city "${CITY}" shown in the location section: ${Boolean(sectionText?.includes(CITY))}`)
await page.screenshot({ path: path.join(root, 'docs/sessions/evidence/task923/review-65/rv65-25-admin-profile.png'), fullPage: true })
await browser.close()
