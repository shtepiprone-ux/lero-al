// Task 927 Review 8, read-only probe on the built Storybook (storybook-static): every animation frame of an opening sheet, in mobile
// emulation (isMobile, touch, DPR 3) or as a plain window. It prints each frame where the dialog's top or height, the Google host's height,
// the Google button's box, the loader or the focused element changes.
// Usage (repository root): node rv8-07-mobile-jump.mjs <state id from rendered-interaction-states.json> <width> <locale> [plain]
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright'

const [stateId, w = '390', locale = 'en', mode = 'mobile'] = process.argv.slice(2)
const width = Number(w)
const ROOT = path.resolve('storybook-static')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff', '.png': 'image/png' }
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]))
  if (!p.startsWith(ROOT)) { res.writeHead(404); res.end(); return }
  fs.readFile(p, (e, d) => { if (e) { res.writeHead(404); res.end(); return } res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] ?? 'application/octet-stream' }); res.end(d) })
})
// served on the host name localhost: Google swaps its in-page button for its iframe button there, never on 127.0.0.1 (review-8/rv8-10)
await new Promise((r) => server.listen(0, 'localhost', r))
const port = server.address().port
const row = JSON.parse(fs.readFileSync('scripts/rendered-interaction-states.json', 'utf8')).states.find((s) => s.id === stateId)
const story = row.story
const browser = await chromium.launch()
const context = await browser.newContext({ viewport: { width, height: 800 }, ...(mode === 'mobile' ? { isMobile: true, hasTouch: true, deviceScaleFactor: 3 } : {}) })
const page = await context.newPage()
// FIX_HOST=1 simulates the proposed correction in the page only (no product file changes): Google's host gets a fixed 2.5rem height
if (process.env.FIX_HOST === '1') await page.addInitScript(() => {
  new MutationObserver(() => {
    const f = document.querySelector('[role="dialog"] iframe')
    const host = f?.parentElement?.parentElement
    if (host && !host.dataset.fixed) { host.dataset.fixed = '1'; host.style.height = '2.5rem' }
  }).observe(document, { childList: true, subtree: true })
})
await page.addInitScript(() => {
  window.__frames = []
  const t0 = performance.now()
  const r1 = (n) => Math.round(n * 10) / 10
  const sample = () => {
    const d = document.querySelector('[role="dialog"]')
    if (d) {
      const host = d.querySelector('[role="status"]')?.parentElement ?? d.querySelector('iframe')?.closest('div[style], div')?.parentElement
      const btn = d.querySelector('.nsm7Bb-HzV7m-LgbsSe')
      const b = btn?.getBoundingClientRect()
      const r = d.getBoundingClientRect()
      window.__frames.push({
        t: Math.round(performance.now() - t0), top: r1(r.top), h: r1(r.height),
        loader: Boolean(d.querySelector('[role="status"]')),
        btn: b ? `${r1(b.top - r.top)}+${r1(b.height)}x${r1(b.width)}` : '-',
        iframes: d.querySelectorAll('iframe').length,
        btns: d.querySelectorAll('.nsm7Bb-HzV7m-LgbsSe').length,
        hostKids: (d.querySelector('iframe')?.parentElement?.parentElement?.children.length ?? -1) + '/' + [...(d.querySelector('iframe')?.parentElement?.parentElement?.children ?? [])].map((c) => Math.round(c.getBoundingClientRect().height)).join(','),
        vv: r1(window.visualViewport?.height ?? 0), sy: Math.round(window.scrollY),
        focus: document.activeElement?.tagName + (document.activeElement?.getAttribute('type') ? ':' + document.activeElement.getAttribute('type') : ''),
      })
    }
    if (performance.now() - t0 < 9000) requestAnimationFrame(sample)
  }
  requestAnimationFrame(sample)
})
// SB_URL points the probe at a running Storybook (the owner's `npm run storybook` on :6006) instead of storybook-static
const base = process.env.SB_URL ?? `http://localhost:${port}`
await page.goto(`${base}/iframe.html?id=${story}&viewMode=story&globals=locale:${locale}`)
if (row.open.kind === 'click') {
  await page.waitForSelector('#storybook-root button', { timeout: 30000 })
  await page.waitForTimeout(1500)
  await page.evaluate(() => { window.__frames = [] })
  await page.evaluate((sel) => document.querySelector('#storybook-root').querySelector(sel).click(), row.open.selector)
}
await page.waitForTimeout(7000)
const frames = await page.evaluate(() => window.__frames)
console.log(`@${stateId} ${width} ${locale} ${mode}: ${frames.length} frames`)
let last = ''
for (const f of frames) {
  const key = JSON.stringify([f.top, f.h, f.loader, f.btn, f.iframes, f.btns, f.hostKids, f.vv, f.sy, f.focus])
  if (key !== last) console.log(`t=${f.t} top=${f.top} h=${f.h} loader=${f.loader} btn=${f.btn} iframes=${f.iframes} btns=${f.btns} hostKids=${f.hostKids} vv=${f.vv} sy=${f.sy} focus=${f.focus}`)
  last = key
}
await browser.close()
server.close()
