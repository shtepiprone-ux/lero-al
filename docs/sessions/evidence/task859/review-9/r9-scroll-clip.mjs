// Review 9 (Opus): reproduce the owner's 2026-10-08 report "під час скролу обрізання контенту відбувається не так як
// треба" on CreateTicketDialogView Complaint / Complaint Same User at 1387x812 (the owner's canvas), en, DPR 2.
// Measures the structured dialog's regions (header, header divider, body, footer) and the body's padding, then scrolls
// the body to 0, 40, middle and end and crops the top and bottom edges of the body.
import { createRequire } from 'node:module'
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const require = createRequire('C:/Claude_Code_Projects/lero-al/package.json')
const { chromium } = require('playwright')
const ROOT = 'C:/Claude_Code_Projects/lero-al/storybook-static'
const DIR = path.dirname(fileURLToPath(import.meta.url))
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp' }
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]))
  fs.readFile(p, (e, d) => { if (e) { res.writeHead(404); res.end(); return } res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] ?? 'application/octet-stream' }); res.end(d) })
}).listen(6195)
const browser = await chromium.launch({ ignoreDefaultArgs: ['--hide-scrollbars'] })
const out = []
for (const story of ['complaint', 'complaint-same-user', 'support']) {
  const ctx = await browser.newContext({ viewport: { width: 1387, height: 812 }, deviceScaleFactor: 2 })
  const page = await ctx.newPage()
  await page.goto(`http://127.0.0.1:6195/iframe.html?id=patterns-mantine-createticketdialogview--${story}&globals=locale:en&viewMode=story`)
  await page.waitForSelector('.mantine-Modal-content', { timeout: 15000 })
  await page.waitForTimeout(1500)
  const measure = () => page.evaluate(() => {
    const box = el => { if (!el) return null; const r = el.getBoundingClientRect(); return { left: Math.round(r.left), w: Math.round(r.width), top: Math.round(r.top), bottom: Math.round(r.bottom), h: Math.round(r.height) } }
    const content = document.querySelector('.mantine-Modal-content')
    const header = content.querySelector('.mantine-Modal-header')
    const body = content.querySelector('.mantine-Modal-body')
    const footer = content.lastElementChild !== body ? content.lastElementChild : null
    const bs = getComputedStyle(body)
    const first = body.firstElementChild?.firstElementChild ?? body.firstElementChild
    return {
      content: box(content), header: box(header), body: box(body), footer: box(footer),
      bodyPad: `${bs.paddingTop} ${bs.paddingRight} ${bs.paddingBottom} ${bs.paddingLeft}`,
      bodyScroll: { top: Math.round(body.scrollTop), h: body.scrollHeight, client: body.clientHeight },
      firstChild: box(first), firstChildTag: first?.className?.toString().slice(0, 80),
      headerChildren: [...header.children].map(c => c.className.toString().slice(0, 60)),
    }
  })
  const rec = { story, at: {} }
  for (const pos of ['top', 'p40', 'middle', 'end']) {
    await page.evaluate(p => {
      const b = document.querySelector('.mantine-Modal-body')
      b.scrollTop = p === 'top' ? 0 : p === 'p40' ? 40 : p === 'middle' ? (b.scrollHeight - b.clientHeight) / 2 : b.scrollHeight
    }, pos)
    await page.waitForTimeout(300)
    const m = await measure()
    rec.at[pos] = m
    const c = m.content
    await page.screenshot({ path: path.join(DIR, `r9-clip-${story}-${pos}-top.png`), clip: { x: c.left, y: m.header.top, width: c.w, height: 190 } })
    if (m.footer) await page.screenshot({ path: path.join(DIR, `r9-clip-${story}-${pos}-bottom.png`), clip: { x: c.left, y: m.footer.top - 120, width: c.w, height: 120 + m.footer.h } })
  }
  out.push(rec)
  await ctx.close()
}
await browser.close(); server.close()
fs.writeFileSync(path.join(DIR, 'r9-scroll-clip.json'), JSON.stringify({ platform: process.platform, node: process.version, out }, null, 1))
for (const r of out) for (const [k, m] of Object.entries(r.at)) console.log(r.story, k, JSON.stringify({ header: m.header, body: m.body, footer: m.footer, pad: m.bodyPad, scroll: m.bodyScroll, first: m.firstChild }))
