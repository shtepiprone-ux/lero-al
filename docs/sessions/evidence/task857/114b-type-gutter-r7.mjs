// Revision 7 GR-3c (computed font sizes) and GR-3d (four edge gaps) for the four new pattern Stories.
import { createRequire } from 'node:module'
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
const require = createRequire('C:/Claude_Code_Projects/lero-al/package.json')
const { chromium } = require('playwright')
const ROOT = 'C:/Claude_Code_Projects/lero-al/storybook-static'
const EV = 'C:/Claude_Code_Projects/lero-al/docs/sessions/evidence/task857'
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png' }
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]))
  fs.readFile(p, (e, d) => { if (e) { res.writeHead(404); res.end(); return } res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] ?? 'application/octet-stream' }); res.end(d) })
}).listen(6122)
const browser = await chromium.launch()
const out = []
const ids = ['dialogsections--default', 'detaillist--default', 'navrowlist--default', 'dialogfooter--default'].map(s => `patterns-mantine-${s}`)
for (const id of ids) for (const vw of [320, 390, 768, 1024, 1440]) {
  const page = await (await browser.newContext({ deviceScaleFactor: 1, viewport: { width: vw, height: 900 } })).newPage()
  await page.goto(`http://127.0.0.1:6122/iframe.html?id=${id}&globals=locale:sq&viewMode=story`)
  await page.waitForSelector('#storybook-root > *', { state: 'attached', timeout: 20000 }); await page.waitForTimeout(1000)
  out.push({ id, vw, ...(await page.evaluate(() => {
    const root = document.querySelector('#storybook-root')
    const sizes = {}
    const texts = [...root.querySelectorAll('.mantine-Card-root *, .mantine-Paper-root *, .mantine-NavRowList *')]
    for (const el of texts) { if (el.children.length === 0 && el.textContent.trim() && el.tagName !== 'STYLE') { const s = getComputedStyle(el).fontSize; sizes[s] = (sizes[s] || 0) + 1 } }
    // The gutter box is the first descendant carrying padding (StoryPageGutter); gaps are its four paddings plus the content's own offsets.
    const gutter = [...root.querySelectorAll('div')].find(d => parseFloat(getComputedStyle(d).paddingTop) > 0)
    const gs = getComputedStyle(gutter)
    const content = gutter.firstElementChild.getBoundingClientRect()
    return { fontSizes: sizes, gutterPadding: { top: gs.paddingTop, right: gs.paddingRight, bottom: gs.paddingBottom, left: gs.paddingLeft }, content: { left: Math.round(content.left), right: Math.round(innerWidth - content.right), top: Math.round(content.top) }, overflowX: document.documentElement.scrollWidth > innerWidth }
  })) })
  await page.context().close()
}
fs.writeFileSync(`${EV}/114b-type-gutter-r7.json`, JSON.stringify(out, null, 2))
for (const o of out) console.log(o.id.split('--')[0].replace('patterns-mantine-', ''), o.vw, JSON.stringify(o.fontSizes), JSON.stringify(o.gutterPadding), JSON.stringify(o.content), o.overflowX)
await browser.close(); server.close()
