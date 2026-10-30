// Task 923 Review 45 (Opus, 2026-10-23): two measurements that the GR-3j probe (r40-05) does not make, on the built Storybook (storybook-static, read-only).
//  1. `with-password`: the new-address field's placeholder. Its text width (canvas measureText in the input's own font) against the input's content box; a wider text is
//     cut by the browser. Also whether the description under the field repeats the placeholder's text.
//  2. `waiting-for-confirmation`: where the resend action's text starts, against the left edge of the waiting notice above it.
// Usage (repository root): node docs/sessions/evidence/task923/review-45/rv45-15-placeholder-anchor-probe.mjs
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(path.resolve('package.json'))
const { chromium } = require('playwright')
const ROOT = path.resolve('storybook-static')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff' }
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]))
  if (!p.startsWith(ROOT)) { res.writeHead(404); res.end(); return }
  fs.readFile(p, (e, d) => {
    if (e) { res.writeHead(404); res.end(); return }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] ?? 'application/octet-stream' })
    res.end(d)
  })
})
await new Promise((r) => server.listen(0, r))
const port = server.address().port
const browser = await chromium.launch()
const url = (s, l) => `http://127.0.0.1:${port}/iframe.html?id=patterns-mantine-cabinetemailchangesectionview--${s}&viewMode=story&globals=locale:${l}`
let clipped = 0
let repeated = 0
let centred = 0
for (const w of [320, 390, 639, 640, 768, 1024, 1440]) {
  const page = await browser.newPage({ viewport: { width: w, height: 900 } })
  for (const l of ['sq', 'en', 'uk', 'it']) {
    await page.goto(url('with-password', l))
    await page.waitForSelector('#storybook-root input[type="email"]', { timeout: 20000 })
    await page.evaluate(() => document.fonts.ready)
    const f = await page.evaluate(() => {
      const input = document.querySelector('#storybook-root input[type="email"]')
      const cs = getComputedStyle(input)
      const ctx = document.createElement('canvas').getContext('2d')
      ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`
      const box = input.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)
      const description = document.getElementById(input.getAttribute('aria-describedby')?.split(' ')[0] ?? '')?.textContent ?? ''
      return { text: input.placeholder, width: Math.round(ctx.measureText(input.placeholder).width), box: Math.round(box), sameAsDescription: input.placeholder !== '' && input.placeholder === description }
    })
    const cut = f.text !== '' && f.width > f.box
    clipped += cut ? 1 : 0
    repeated += f.sameAsDescription ? 1 : 0
    console.log(`placeholder ${l} ${w}: text ${f.width}px, box ${f.box}px, ${cut ? 'CUT' : 'fits'}; repeats the description: ${f.sameAsDescription}`)

    await page.goto(url('waiting-for-confirmation', l))
    await page.waitForSelector('#storybook-root .mantine-Alert-root', { timeout: 20000 })
    const a = await page.evaluate(() => {
      const alert = document.querySelector('#storybook-root .mantine-Alert-root').getBoundingClientRect()
      const anchor = document.querySelector('#storybook-root button.mantine-Anchor-root')
      const range = document.createRange()
      range.selectNodeContents(anchor)
      const text = range.getBoundingClientRect()
      return { alertLeft: Math.round(alert.left), textLeft: Math.round(text.left), buttonWidth: Math.round(anchor.getBoundingClientRect().width), alertWidth: Math.round(alert.width) }
    })
    const off = a.textLeft - a.alertLeft
    centred += off > 8 ? 1 : 0
    console.log(`resend ${l} ${w}: notice left ${a.alertLeft}px, action text left ${a.textLeft}px (${off}px in), action box ${a.buttonWidth}px of the notice's ${a.alertWidth}px`)
  }
  await page.close()
}
console.log(`cells 28; placeholder cut: ${clipped}; placeholder repeats the description: ${repeated}; resend text more than 8px in from the notice's edge: ${centred}`)
await browser.close()
server.close()
