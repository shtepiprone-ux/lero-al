// Task 923 Review 39 (Opus, 2026-10-23), for R123:
// 1. Baseline (before R123) of the keyless built Storybook: in AuthSheet → Register, RegisterAgent, ForgotPassword and Captcha, at 320 and 1440 px in sq, en, uk, it,
//    the dev note (role="note") of CaptchaWidget: its rect, and the distance from the element above its wrapper and to the submit button. R123 must reproduce these.
// 2. CSS check: in a Mantine-like flex column with gap 16px, a 0×0 child adds two gaps when it is in flow, and none when it is absolutely positioned.
// Usage: node rv39-20-authsheet-baseline-probe.mjs <repo root> <out json>
import fs from 'node:fs'
import path from 'node:path'
import http from 'node:http'
import { createRequire } from 'node:module'
const [ROOT, OUT] = process.argv.slice(2)
const require = createRequire(path.join(ROOT, 'package.json'))
const { chromium } = require('playwright')
const STATIC = path.join(ROOT, 'storybook-static')
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' }
const server = http.createServer((req, res) => {
  const p = path.join(STATIC, decodeURIComponent(new URL(req.url, 'http://x').pathname))
  const file = fs.existsSync(p) && fs.statSync(p).isDirectory() ? path.join(p, 'index.html') : p
  if (!fs.existsSync(file)) { res.writeHead(404); res.end(); return }
  res.writeHead(200, { 'content-type': TYPES[path.extname(file)] ?? 'application/octet-stream' }); fs.createReadStream(file).pipe(res)
})
await new Promise((r) => server.listen(0, r))
const browser = await chromium.launch()
const rows = []
for (const story of ['register', 'register-agent', 'forgot-password', 'captcha']) for (const locale of ['sq', 'en', 'uk', 'it']) for (const width of [320, 1440]) {
  const page = await browser.newPage({ viewport: { width, height: 1000 } })
  await page.goto(`http://localhost:${server.address().port}/iframe.html?id=patterns-mantine-authsheet--${story}&viewMode=story&globals=locale:${locale}`, { waitUntil: 'networkidle' })
  await page.waitForSelector('[role="note"]', { timeout: 20000 })
  const r = await page.evaluate(() => {
    const note = document.querySelector('[role="note"]')
    // the outermost ancestor that holds only the note: today the AuthSheet's Box my="sm"
    let block = note
    while (block.parentElement && block.parentElement.children.length === 1 && !block.parentElement.matches('form, #storybook-root')) block = block.parentElement
    const n = note.getBoundingClientRect()
    const prev = block.previousElementSibling, next = block.nextElementSibling
    return { note: [n.left, n.top, n.width, n.height].map((v) => +v.toFixed(1)), fromAbove: prev ? +(n.top - prev.getBoundingClientRect().bottom).toFixed(1) : null, toBelow: next ? +(next.getBoundingClientRect().top - n.bottom).toFixed(1) : null, belowTag: next?.tagName ?? null }
  })
  rows.push({ story, locale, width, ...r })
  await page.close()
}
const page = await browser.newPage()
await page.setContent(`<div id="col" style="display:flex;flex-direction:column;gap:16px;position:relative">
  <div id="a" style="height:40px"></div><div id="z" style="width:0;height:0;overflow:hidden"></div><div id="b" style="height:40px"></div></div>
  <div id="col2" style="display:flex;flex-direction:column;gap:16px;position:relative">
  <div id="a2" style="height:40px"></div><div style="position:absolute"><div style="width:0;height:0;overflow:hidden"></div></div><div id="b2" style="height:40px"></div></div>`)
const css = await page.evaluate(() => {
  const g = (a, b) => document.getElementById(b).getBoundingClientRect().top - document.getElementById(a).getBoundingClientRect().bottom
  return { inFlowZeroBoxGap: g('a', 'b'), absoluteZeroBoxGap: g('a2', 'b2') }
})
await browser.close(); server.close()
fs.writeFileSync(OUT, JSON.stringify({ at: new Date().toISOString(), storybookIndexMtime: fs.statSync(path.join(STATIC, 'index.html')).mtime.toISOString(), css, rows }, null, 2))
console.log(JSON.stringify(css)); for (const r of rows) console.log(JSON.stringify(r))
