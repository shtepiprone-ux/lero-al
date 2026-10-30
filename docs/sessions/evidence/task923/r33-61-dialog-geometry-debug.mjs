// Task 923 R114 (h) diagnosis (not a gate): prints the markup and rectangles of the human-check box in the contact card and in the message dialog after the press, to see where the
// challenge sits. Usage (server running): node docs/sessions/evidence/task923/r33-61-dialog-geometry-debug.mjs. Prints no secret.
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
const ROOT = path.resolve(import.meta.dirname, '..', '..', '..', '..')
const require = createRequire(path.join(ROOT, 'package.json'))
const { chromium } = require('playwright')
const env = Object.fromEntries(fs.readFileSync(path.join(ROOT, '.env.local'), 'utf8').split(/\r?\n/).filter((l) => /^[A-Z0-9_]+=/.test(l)).map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).replace(/^"|"$/g, '')]))
const m = JSON.parse(fs.readFileSync(path.join(ROOT, 'messages/uk.json'), 'utf8')).listing
const WIDTH = Number(process.env.DEBUG_WIDTH ?? 1440)
const browser = await chromium.launch()
const page = await (await browser.newContext({ viewport: { width: WIDTH, height: 900 } })).newPage()
await page.goto('http://localhost:3000/uk/auth/login', { waitUntil: 'networkidle', timeout: 240000 })
await page.fill('input[type="email"]', env.HYDRATION_AGENT1_EMAIL)
await page.fill('input[type="password"]', env.HYDRATION_AGENT1_PASSWORD)
await Promise.all([page.waitForURL((u) => !/\/auth\/login/.test(String(u)), { timeout: 90000 }).catch(() => null), page.click('button[type="submit"]')])

const dump = async (label) => {
  const info = await page.evaluate(() => {
    const all = [...document.querySelectorAll('[id^="cf-turnstile"], .cf-turnstile')]
    return all.map((host) => {
      const b = host.getBoundingClientRect(), p = host.parentElement.getBoundingClientRect()
      return { id: host.id, hostRect: [Math.round(b.left), Math.round(b.top), Math.round(b.width), Math.round(b.height)], parentRect: [Math.round(p.left), Math.round(p.top), Math.round(p.width), Math.round(p.height)], parentDisplay: getComputedStyle(host.parentElement).display, hostStyle: host.getAttribute('style'), hostChildren: host.children.length, hostHtml: host.outerHTML.slice(0, 400), hasShadow: !!host.shadowRoot, inDialog: !!host.closest('[role="dialog"]') }
    })
  })
  console.log(label, JSON.stringify(info, null, 1))
  for (const f of page.frames()) if (/cloudflare/.test(f.url()) && f.parentFrame() === page.mainFrame()) { const h = await f.frameElement().catch(() => null); console.log(label, 'frame box', h ? JSON.stringify(await h.boundingBox()) : null) }
}

await page.goto('http://localhost:3000/uk/listings/11-mr7ucly4', { waitUntil: 'load', timeout: 240000 })
await page.waitForSelector('[data-testid="listing-contact-card"]')
await page.waitForTimeout(1500)
await page.getByRole('button', { name: m.call, exact: true }).click()
await page.waitForTimeout(8000)
await dump('CARD')

await page.goto('http://localhost:3000/uk/listings/11-mr7ucly4', { waitUntil: 'load', timeout: 240000 })
await page.waitForSelector('[data-testid="listing-contact-card"]')
await page.waitForTimeout(1500)
await page.getByRole('button', { name: m.send_message, exact: true }).click()
await page.getByRole('dialog').waitFor()
await page.getByRole('dialog').getByLabel(m.inquiry_name_label).fill('Alba Hoxha')
await page.getByRole('dialog').getByLabel(m.inquiry_email_label).fill('alba.hoxha@example.com')
await page.getByRole('dialog').getByLabel(m.inquiry_message_label).fill('Hello, I am interested in this flat. May we arrange a visit this week?')
await page.getByRole('dialog').getByRole('button', { name: m.inquiry_submit, exact: true }).click()
await page.waitForTimeout(8000)
await dump('DIALOG')
await browser.close()
