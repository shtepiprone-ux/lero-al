// EXECUTOR COPY of ../amendment-4/a4-02-centre-probe.mjs (Opus). Only change: the dialog body selector also accepts `.mantine-Drawer-body`, because below 640 px the deletion dialog is a MantineDrawer bottom sheet (see a4-03-diag-modal-dom.txt), so the original selector finds null and the original crashes. The original is untouched; this copy is a deviation for Opus to rule on.
// Task 927 Amendment 4 (Opus, 2026-10-23), after owner-qa/oq-02-google-centre-probe.mjs: on the built Storybook (storybook-static, read-only) it measures where Google's
// drawn button (`.nsm7Bb-HzV7m-LgbsSe`) stands in its container, in two places:
//  - AuthSheet `Login`: against the sheet's full-width submit button;
//  - the fourth section of Modal `DeleteConfirmPassword` (Google's real button in the deletion dialog, Amendment 4 R17), after its button opens the dialog: against
//    the dialog body.
// A button narrower than its container must have equal gaps on both sides (within 1 px); a button as wide as its container has none.
// Usage (repository root): node docs/sessions/evidence/task927/amendment-4/a4-02-centre-probe.mjs [login|modal|both]
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(path.resolve('package.json'))
const { chromium } = require('playwright')
const which = process.argv[2] ?? 'both'
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
const url = (id, l) => `http://127.0.0.1:${port}/iframe.html?id=${id}&viewMode=story&globals=locale:${l}`
const lines = []
let cells = 0
let offCentre = 0
const gaps = (container) => {
  const g = (container ?? document).querySelector('.nsm7Bb-HzV7m-LgbsSe')
  if (!g) return null
  const box = container ? container.getBoundingClientRect() : null
  return { g: g.getBoundingClientRect(), box }
}
for (const l of ['en', 'sq', 'uk', 'it']) {
  for (const width of [320, 390, 480, 560, 639, 640, 1024, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } })
    if (which !== 'modal') {
      await page.goto(url('patterns-mantine-authsheet--login', l))
      await page.waitForSelector('.nsm7Bb-HzV7m-LgbsSe', { timeout: 30000 })
      await page.waitForTimeout(1200)
      const m = await page.evaluate(() => {
        const g = document.querySelector('.nsm7Bb-HzV7m-LgbsSe').getBoundingClientRect()
        const s = [...document.querySelectorAll('button[type="submit"]')].find((b) => b.offsetParent).getBoundingClientRect()
        return { w: Math.round(g.width), left: Math.round(g.left - s.left), right: Math.round(s.right - g.right), form: Math.round(s.width) }
      })
      const ok = Math.abs(m.left - m.right) <= 1
      cells++; if (!ok) offCentre++
      lines.push(`login ${l} ${width}: Google ${m.w}px in a ${m.form}px form, gap left ${m.left}px, right ${m.right}px, ${ok ? 'centred' : 'NOT centred'}`)
    }
    if (which !== 'login') {
      await page.goto(url('mantine-primitives-modal--delete-confirm-password', l))
      await page.waitForSelector('#storybook-root button', { timeout: 30000 })
      const opened = await page.evaluate(() => {
        const sections = [...document.querySelectorAll('#storybook-root button')].filter((b) => b.offsetParent)
        if (sections.length < 4) return false
        sections[3].click()
        return true
      })
      if (!opened) { lines.push(`modal ${l} ${width}: NO fourth section`); cells++; offCentre++; await page.close(); continue }
      await page.waitForSelector('[role="dialog"] .nsm7Bb-HzV7m-LgbsSe', { timeout: 30000 }).catch(() => null)
      await page.waitForTimeout(1200)
      const m = await page.evaluate(() => {
        const g = document.querySelector('[role="dialog"] .nsm7Bb-HzV7m-LgbsSe')
        if (!g) return null
        const body = document.querySelector('[role="dialog"] .mantine-Modal-body, [role="dialog"] .mantine-Drawer-body')
        const cs = getComputedStyle(body)
        const b = body.getBoundingClientRect()
        const left = b.left + parseFloat(cs.paddingLeft), right = b.right - parseFloat(cs.paddingRight)
        const r = g.getBoundingClientRect()
        return { w: Math.round(r.width), left: Math.round(r.left - left), right: Math.round(right - r.right), body: Math.round(right - left) }
      })
      cells++
      if (!m) { offCentre++; lines.push(`modal ${l} ${width}: NO Google button in the dialog`) }
      else {
        const ok = Math.abs(m.left - m.right) <= 1
        if (!ok) offCentre++
        lines.push(`modal ${l} ${width}: Google ${m.w}px in a ${m.body}px dialog body, gap left ${m.left}px, right ${m.right}px, ${ok ? 'centred' : 'NOT centred'}`)
      }
    }
    await page.close()
  }
}
lines.push(`cells ${cells}; Google button not centred: ${offCentre}`)
console.log(lines.join('\n'))
await browser.close()
server.close()
process.exitCode = offCentre ? 1 : 0
