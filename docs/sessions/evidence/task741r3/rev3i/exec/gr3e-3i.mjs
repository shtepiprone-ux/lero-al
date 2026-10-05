// Task 741 Revision 3h — GR-3e: the "Save search" modal opened in ListingsActionRow at 390 and 1440 (unchanged by 3h;
// re-checked because ListingsShellView renders it).
import { createRequire } from 'node:module'
import { createServer } from 'node:http'
import { readFile, writeFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
const require = createRequire('C:/Claude_Code_Projects/lero-al/package.json')
const { chromium } = require('playwright')
const dir = 'C:/Claude_Code_Projects/lero-al/storybook-static'
const D = 'docs/sessions/evidence/task741r3/rev3i/exec/'
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg' }
const server = createServer(async (req, res) => { try { const p = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([\/\\])+/, ''); const b = await readFile(join(dir, p || 'index.html')); res.writeHead(200, { 'content-type': MIME[extname(p)] ?? 'application/octet-stream' }); res.end(b) } catch { res.writeHead(404); res.end() } })
await new Promise(r => server.listen(0, r))
const browser = await chromium.launch()
const out = {}
for (const w of [390, 1440]) {
  const page = await browser.newPage({ viewport: { width: w, height: 900 } })
  await page.goto(`http://127.0.0.1:${server.address().port}/iframe.html?id=patterns-mantine-listingsactionrow--default&viewMode=story&globals=locale:en`)
  await page.waitForSelector('#storybook-root > :not(style)'); await page.waitForTimeout(1200)
  await page.getByRole('button', { name: 'Save search' }).first().click(); await page.waitForTimeout(800)
  out[w] = await page.evaluate(() => {
    const dlg = document.querySelector('[role=dialog]')
    const bs = [...dlg.querySelectorAll('button')].filter(b => b.textContent.trim()).map(b => { const r = b.getBoundingClientRect(); return { text: b.textContent.trim(), variant: b.getAttribute('data-variant'), x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width) } })
    return { buttons: bs, textButtons: bs.filter(b => b.variant === 'subtle' || b.variant === 'transparent').length }
  })
  await page.screenshot({ path: `${D}gr3e-save-search-${w}.png` })
  await page.close()
}
await browser.close(); server.close()
await writeFile(D + 'gr3e-3i.json', JSON.stringify(out, null, 1) + '\n')
console.log(JSON.stringify(out))
