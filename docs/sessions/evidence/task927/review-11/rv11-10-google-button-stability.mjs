// Task 927 Review 11 (Opus), read-only probe on the built Storybook (storybook-static), served on the host name localhost (where Google swaps its
// own button, review-8/rv8-10). It opens a sheet or dialog in mobile emulation (isMobile, touch, DPR 3) and records every animation frame.
// In each frame it counts the Google sign-in controls of the dialog: Google's in-page button (.nsm7Bb-HzV7m-LgbsSe), Google's button iframe
// (iframe[src*="gsi/button"]) and our own button ([data-google-sign-in]). From the first frame with a control to the last frame:
//  - exactly one control in every frame;
//  - that control has one width, one height and one distance from the dialog's bottom edge;
//  - the dialog's height changes only in a frame where the number of alerts in the dialog changes (the captcha alert of Review 9 F9).
// Usage (repository root): node rv11-10-google-button-stability.mjs [<state id> <width> <locale>]
// Without arguments it runs the matrix: the three states below x 320, 390, 639 x en, uk. Exit code 1 when any run fails.
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright'

const STATES = [
  'mantine-primitives-modal--delete-confirm-password~delete-google-ready',
  'patterns-mantine-authsheet--welcome-back',
  'patterns-mantine-authsheet--login',
]
const args = process.argv.slice(2)
const runs = args.length === 3 ? [[args[0], Number(args[1]), args[2]]] : STATES.flatMap((s) => [320, 390, 639].flatMap((w) => ['en', 'uk'].map((l) => [s, w, l])))

const ROOT = path.resolve('storybook-static')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff', '.png': 'image/png' }
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]))
  if (!p.startsWith(ROOT)) { res.writeHead(404); res.end(); return }
  fs.readFile(p, (e, d) => { if (e) { res.writeHead(404); res.end(); return } res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] ?? 'application/octet-stream' }); res.end(d) })
})
await new Promise((r) => server.listen(0, 'localhost', r))
const port = server.address().port
const registry = JSON.parse(fs.readFileSync('scripts/rendered-interaction-states.json', 'utf8')).states
const browser = await chromium.launch()
let failed = 0

for (const [stateId, width, locale] of runs) {
  const row = registry.find((s) => s.id === stateId)
  const context = await browser.newContext({ viewport: { width, height: 800 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 })
  const page = await context.newPage()
  await page.addInitScript(() => {
    window.__frames = []
    const t0 = performance.now()
    const r1 = (n) => Math.round(n * 2) / 2
    const sample = () => {
      const d = document.querySelector('[role="dialog"]')
      if (d) {
        const controls = [...d.querySelectorAll('.nsm7Bb-HzV7m-LgbsSe, iframe[src*="gsi/button"], [data-google-sign-in]')]
          .filter((e) => { const b = e.getBoundingClientRect(); return b.width > 0 && b.height > 0 })
        const r = d.getBoundingClientRect()
        const b = controls[0]?.getBoundingClientRect()
        window.__frames.push({
          t: Math.round(performance.now() - t0), h: r1(r.height), n: controls.length,
          box: b ? `${r1(b.width)}x${r1(b.height)}@${r1(r.bottom - b.bottom)}` : '-',
          kinds: controls.map((e) => (e.tagName === 'IFRAME' ? 'iframe' : e.hasAttribute('data-google-sign-in') ? 'ours' : 'gis')).join('+') || '-',
          alerts: d.querySelectorAll('.mantine-Alert-root').length,
        })
      }
      if (performance.now() - t0 < 9000) requestAnimationFrame(sample)
    }
    requestAnimationFrame(sample)
  })
  await page.goto(`http://localhost:${port}/iframe.html?id=${row.story}&viewMode=story&globals=locale:${locale}`)
  if (row.open?.kind === 'click') {
    await page.waitForSelector('#storybook-root button', { timeout: 30000 })
    await page.waitForTimeout(1500)
    await page.evaluate(() => { window.__frames = [] })
    await page.evaluate((sel) => document.querySelector('#storybook-root').querySelector(sel).click(), row.open.selector)
  }
  await page.waitForTimeout(7000)
  const frames = await page.evaluate(() => window.__frames)
  await context.close()

  const first = frames.findIndex((f) => f.n > 0)
  const problems = []
  if (first < 0) problems.push('no Google control in any frame')
  else {
    const tail = frames.slice(first)
    const many = tail.filter((f) => f.n !== 1)
    if (many.length) problems.push(`${many.length} frame(s) without exactly one Google control, first t=${many[0].t} n=${many[0].n} kinds=${many[0].kinds}`)
    const boxes = [...new Set(tail.filter((f) => f.n === 1).map((f) => f.box))]
    if (boxes.length > 1) problems.push(`the control's box changes: ${boxes.join(' -> ')}`)
    for (let i = 1; i < tail.length; i++) {
      if (tail[i].h !== tail[i - 1].h && tail[i].alerts === tail[i - 1].alerts) { problems.push(`the dialog's height changes without an alert at t=${tail[i].t}: ${tail[i - 1].h} -> ${tail[i].h}`); break }
    }
  }
  if (problems.length) failed++
  console.log(`## ${stateId} ${width} ${locale}: ${problems.length ? 'FAIL | ' + problems.join(' | ') : 'ok'}`)
  let last = ''
  for (const f of frames) {
    const key = JSON.stringify([f.h, f.n, f.box, f.kinds, f.alerts])
    if (key !== last) console.log(`t=${f.t} h=${f.h} controls=${f.n} kinds=${f.kinds} box=${f.box} alerts=${f.alerts}`)
    last = key
  }
}
console.log(`runs ${runs.length}; failing ${failed}`)
await browser.close()
server.close()
process.exitCode = failed ? 1 : 0
