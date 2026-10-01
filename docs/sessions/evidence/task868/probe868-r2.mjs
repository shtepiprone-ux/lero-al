// Task 868 revision 2 — AC23 (CmsPageView gutter, four sides, all six exports) and AC24 (editor content min height).
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module'
const require = createRequire(import.meta.url); const { chromium } = require('playwright')
const ROOT = path.resolve('storybook-static')
const server = http.createServer((req, res) => { const f = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname)); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end() } res.writeHead(200, { 'content-type': f.endsWith('.html') ? 'text/html' : f.endsWith('.js') || f.endsWith('.mjs') ? 'text/javascript' : f.endsWith('.css') ? 'text/css' : f.endsWith('.json') ? 'application/json' : 'application/octet-stream' }); fs.createReadStream(f).pipe(res) })
await new Promise((r) => server.listen(0, '127.0.0.1', r)); const BASE = `http://127.0.0.1:${server.address().port}`
const browser = await chromium.launch()
const page_ = async (id, w, loc = 'sq') => {
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 } })
  await ctx.route('https://res.cloudinary.com/**', (r) => r.fulfill({ status: 200, contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800"/>' }))
  const page = await ctx.newPage()
  await page.goto(`${BASE}/iframe.html?id=${id}&viewMode=story&globals=locale:${loc}`, { waitUntil: 'load' })
  await page.waitForSelector('#storybook-root > :not(style)', { timeout: 20000 }).catch(() => {}); await page.waitForTimeout(1800)
  return { ctx, page }
}
for (const s of ['default', 'title-only', 'body-only', 'long-title-wrap', 'rich-body', 'rich-layout']) {
  const row = []
  for (const w of [320, 390, 1024, 1440]) {
    const { ctx, page } = await page_(`patterns-mantine-cmspageview--${s}`, w)
    const g = await page.evaluate(() => {
      const main = document.querySelector('#storybook-root main'); const cs = getComputedStyle(main); const r = main.getBoundingClientRect(); const vw = document.documentElement.clientWidth
      const pl = parseFloat(cs.paddingLeft), pr = parseFloat(cs.paddingRight)
      return { top: Math.round(r.top + scrollY + parseFloat(cs.paddingTop)), bottom: parseFloat(cs.paddingBottom), left: Math.round(r.left + pl), right: Math.round(vw - r.right + pr), vw, overflow: document.documentElement.scrollWidth > vw + 1 }
    })
    row.push(`${w}: T${g.top} R${g.right} B${g.bottom} L${g.left}${g.overflow ? ' OVERFLOW' : ''} (expect L/R ${w < 1024 ? 16 : Math.round((w - 768) / 2 + 16)})`)
    await ctx.close()
  }
  console.log(`GR-3d ${s}: ` + row.join(' · '))
}
for (const w of [390, 1440]) {
  const { ctx, page } = await page_('patterns-mantine-richtexteditor--default', w)
  const m = await page.evaluate(() => { const c = document.querySelector('.mantine-RichTextEditor-content'); const cs = getComputedStyle(c); const t = document.querySelector('.tiptap'); return { minHeight: cs.minHeight, height: Math.round(c.getBoundingClientRect().height * 10) / 10, lineHeight: getComputedStyle(t).lineHeight, fontSize: getComputedStyle(t).fontSize } })
  console.log(`AC24 editor content @${w}: ${JSON.stringify(m)}`)
  await ctx.close()
}
await browser.close(); server.close()
