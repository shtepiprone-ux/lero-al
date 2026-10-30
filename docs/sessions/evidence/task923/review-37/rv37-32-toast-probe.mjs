// Task 923 Review 37 (Opus, 2026-10-23), after the owner's report that the refusal toast shows on a phone but not on a desktop: on the owner's running local server, signed in
// with HYDRATION_AGENT1 (read from .env.local; nothing secret is printed), it presses Call on a listing card at 1440 px and at 390 px and does NOT answer Cloudflare's challenge.
// It records, every 500 ms for up to 40 s, whether a Mantine notification exists, its rectangle, what element is on top at its centre, and the challenge box's state.
// Server Action POSTs are aborted, so no database row is written. Usage: node rv37-32-toast-probe.mjs <repo root> <listing path> <out file>
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'

const [ROOT, LISTING, OUT] = process.argv.slice(2)
const require = createRequire(path.join(ROOT, 'package.json'))
const { chromium } = require('playwright')
const BASE = 'http://localhost:3000'
const env = Object.fromEntries(fs.readFileSync(path.join(ROOT, '.env.local'), 'utf8').split(/\r?\n/).filter((l) => /^[A-Z0-9_]+=/.test(l)).map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).replace(/^"|"$/g, '')]))
const uk = JSON.parse(fs.readFileSync(path.join(ROOT, 'messages', 'uk.json'), 'utf8')).listing
const lines = [`# ${new Date().toISOString()} ${process.platform} node ${process.version} listing ${LISTING}`]
const log = (s) => { lines.push(s); console.log(s) }

const browser = await chromium.launch()
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await context.newPage()
page.on('console', (m) => { if (/turnstile|cloudflare|notification|error/i.test(m.text()) && !/unsafe-eval/.test(m.text())) log(`console ${m.type()}: ${m.text().slice(0, 200)}`) })
await page.route('**/*', (route) => (route.request().method() === 'POST' && route.request().headers()['next-action'] && !/auth/.test(route.request().url()) && route.request().url().includes('/listings/') ? route.abort() : route.continue()))

await page.goto(`${BASE}/uk/auth/login`, { waitUntil: 'networkidle', timeout: 240000 })
await page.fill('input[type="email"]', env.HYDRATION_AGENT1_EMAIL)
await page.fill('input[type="password"]', env.HYDRATION_AGENT1_PASSWORD)
await Promise.all([page.waitForURL((u) => !/\/auth\/login/.test(String(u)), { timeout: 90000 }).catch(() => null), page.click('button[type="submit"]')])
log(`signed in: /api/auth/me ${(await page.request.get(`${BASE}/api/auth/me`)).status()}`)

for (const width of [1440, 390]) {
  await page.setViewportSize({ width, height: width > 640 ? 900 : 844 })
  await page.goto(`${BASE}${LISTING}`, { waitUntil: 'load', timeout: 240000 })
  await page.waitForSelector('[data-testid="listing-contact-card"]', { timeout: 120000 })
  await page.waitForTimeout(3000)
  const call = page.locator('[data-testid="listing-contact-card"] button', { hasText: uk.call }).first()
  await call.scrollIntoViewIfNeeded()
  const t0 = Date.now()
  await call.click()
  log(`--- ${width}px: pressed Call (${uk.call})`)
  let seen = false
  for (let i = 0; i < 80; i++) {
    await page.waitForTimeout(500)
    const s = await page.evaluate(() => {
      const n = document.querySelector('.mantine-Notification-root')
      const iframe = document.querySelector('[data-testid="listing-contact-card"] iframe')
      const ifr = iframe ? iframe.getBoundingClientRect() : null
      const out = { notification: null, iframe: ifr ? { w: Math.round(ifr.width), h: Math.round(ifr.height), visible: !!iframe.offsetParent } : null, scrollY: Math.round(scrollY) }
      if (n) {
        const r = n.getBoundingClientRect()
        const cs = getComputedStyle(n)
        const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)
        const rootEl = n.closest('.mantine-Notifications-root')
        const rr = rootEl.getBoundingClientRect()
        out.notification = { text: n.textContent.trim().slice(0, 90), rect: [r.left, r.top, r.width, r.height].map(Math.round), opacity: cs.opacity, transform: cs.transform, visibility: cs.visibility,
          onTop: top ? `${top.tagName.toLowerCase()}.${String(top.className).slice(0, 60)}` : null, topIsInside: !!top && n.contains(top), container: { pos: rootEl.dataset.position, rect: [rr.left, rr.top, rr.width, rr.height].map(Math.round), z: getComputedStyle(rootEl).zIndex },
          viewport: [innerWidth, innerHeight] }
      }
      return out
    })
    if (s.notification && !seen) {
      seen = true
      log(`${width}px +${((Date.now() - t0) / 1000).toFixed(1)}s notification: ${JSON.stringify(s.notification)}; challenge iframe ${JSON.stringify(s.iframe)}`)
      await page.screenshot({ path: path.join(path.dirname(OUT), `rv37-32-toast-${width}.png`) })
      break
    }
    if (i % 10 === 0) log(`${width}px +${((Date.now() - t0) / 1000).toFixed(1)}s no notification; challenge iframe ${JSON.stringify(s.iframe)}`)
  }
  if (!seen) { log(`${width}px: NO notification within 40 s`); await page.screenshot({ path: path.join(path.dirname(OUT), `rv37-32-toast-${width}-none.png`) }) }
}
await browser.close()
fs.writeFileSync(OUT, lines.join('\n') + '\n')
