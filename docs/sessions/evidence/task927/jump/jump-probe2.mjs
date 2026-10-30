// Read-only probe: what changes the height of the dialog of the `~delete-google-ready` section after it opens (built Storybook).
// Usage (repository root): node docs/sessions/evidence/task927/jump/jump-probe2.mjs <width> <locale> [delayGoogleMs] [mobile]
//  delayGoogleMs: delays the response of accounts.google.com by that many ms (a slower network), 0 = as is.
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(path.resolve('package.json'))
const { chromium } = require('playwright')
const width = Number(process.argv[2] ?? 390)
const locale = process.argv[3] ?? 'en'
const delay = Number(process.argv[4] ?? 0)
const mobile = process.argv[5] === 'mobile'
const ROOT = path.resolve('storybook-static')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff', '.png': 'image/png' }
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]))
  if (!p.startsWith(ROOT)) { res.writeHead(404); res.end(); return }
  fs.readFile(p, (e, d) => { if (e) { res.writeHead(404); res.end(); return } res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] ?? 'application/octet-stream' }); res.end(d) })
})
await new Promise((r) => server.listen(0, r))
const port = server.address().port
const browser = await chromium.launch()
const STORY = 'mantine-primitives-modal--delete-confirm-password'
const registry = JSON.parse(fs.readFileSync('scripts/rendered-interaction-states.json', 'utf8'))
const row = registry.states.find((s) => s.id === STORY + '~delete-google-ready')
const context = await browser.newContext({ viewport: { width, height: 800 }, ...(mobile ? { isMobile: true, hasTouch: true, deviceScaleFactor: 3 } : {}) })
if (delay > 0) await context.route(/accounts\.google\.com/, async (route) => { await new Promise((r) => setTimeout(r, delay)); await route.continue() })
const page = await context.newPage()
await page.goto(`http://127.0.0.1:${port}/iframe.html?id=${STORY}&viewMode=story&globals=locale:${locale}`)
await page.waitForSelector('#storybook-root button', { timeout: 30000 })
await page.waitForTimeout(1500)
await page.evaluate(() => {
  window.__frames = []
  const t0 = performance.now()
  const sample = () => {
    const d = document.querySelector('[role="dialog"]')
    if (d) {
      const input = d.querySelector('input')
      const wrapper = input?.closest('.mantine-Stack-root')?.parentElement?.parentElement
      const boxes = wrapper ? [...wrapper.children].filter((c) => !c.classList.contains('mantine-Divider-root')) : []
      const googleBox = boxes[1]
      const iframe = d.querySelector('iframe')
      window.__frames.push({
        t: Math.round(performance.now() - t0),
        top: Math.round(d.getBoundingClientRect().top * 10) / 10, h: Math.round(d.getBoundingClientRect().height * 10) / 10,
        sections: boxes.map((b) => Math.round(b.getBoundingClientRect().height * 10) / 10).join('/'),
        google: googleBox ? (googleBox.querySelector('[role="status"]') ? 'loader' : googleBox.querySelector('[role="alert"]') ? 'alert' : iframe || d.querySelector('.nsm7Bb-HzV7m-LgbsSe') ? 'button' : 'empty') : '-',
        iframeH: iframe ? Math.round(iframe.getBoundingClientRect().height) : null,
        focus: document.activeElement === input ? 'input' : document.activeElement?.tagName,
      })
    }
    if (performance.now() - t0 < 6000) requestAnimationFrame(sample)
  }
  requestAnimationFrame(sample)
})
await page.evaluate((trigger) => document.querySelector('#storybook-root').querySelector(trigger).click(), row.trigger)
await page.waitForTimeout(6500)
const frames = await page.evaluate(() => window.__frames)
console.log(`@${width} ${locale} delay ${delay}ms mobile ${mobile}: frames with dialog ${frames.length}`)
let last = ''
for (const f of frames) {
  const key = JSON.stringify([f.h, f.sections, f.google, f.iframeH, f.focus])
  if (key !== last) console.log(`t=${f.t} top=${f.top} h=${f.h} sections=${f.sections} google=${f.google} iframeH=${f.iframeH} focus=${f.focus}`)
  last = key
}
await browser.close()
server.close()
