// Task 741 R3c review — identify the ListingsShellView elements behind two probe signals: the badge outside a photo,
// and the element ending past the right edge in uk@320 (with no document overflow).
import { createRequire } from 'node:module'
import { createServer } from 'node:http'
import { readFile, writeFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
const require = createRequire('C:/Claude_Code_Projects/lero-al/package.json')
const { chromium } = require('playwright')
const dir = 'C:/Claude_Code_Projects/lero-al/storybook-static'
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg' }
const server = createServer(async (req, res) => { try { const p = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([\/])+/, ''); const b = await readFile(join(dir, p || 'index.html')); res.writeHead(200, { 'content-type': MIME[extname(p)] ?? 'application/octet-stream' }); res.end(b) } catch { res.writeHead(404); res.end() } })
await new Promise(r => server.listen(0, r))
const base = `http://127.0.0.1:${server.address().port}`
const browser = await chromium.launch()
const out = {}
for (const [loc, w] of [['uk', 320], ['en', 320], ['en', 1440]]) {
  const page = await browser.newPage({ viewport: { width: w, height: 900 }, deviceScaleFactor: 1 })
  await page.goto(`${base}/iframe.html?id=patterns-mantine-listingsshellview--default&viewMode=story&globals=locale:${loc}`)
  await page.waitForSelector('#storybook-root .mantine-Badge-root', { timeout: 30000, state: 'attached' })
  await page.waitForTimeout(1500)
  out[`${loc}@${w}`] = await page.evaluate(() => {
    const root = document.querySelector('#storybook-root')
    const path = e => { const a = []; for (let n = e; n && n !== root && a.length < 6; n = n.parentElement) a.push(n.tagName.toLowerCase() + (n.className && typeof n.className === 'string' ? '.' + n.className.split(' ').filter(c => /mantine-|listing|filter|tabs|chip/i.test(c)).slice(0, 2).join('.') : '')); return a.join(' < ') }
    const clippedBy = e => { for (let n = e.parentElement; n && n !== root; n = n.parentElement) { const s = getComputedStyle(n); if (/(hidden|auto|scroll|clip)/.test(s.overflowX)) return path(n) + ' [overflow-x ' + s.overflowX + ', right ' + Math.round(n.getBoundingClientRect().right) + ']' } return 'none' }
    const past = [...root.querySelectorAll('*')].filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.right > innerWidth + 0.5 && (e.children.length === 0 || e.matches('img,svg,button,[class*=Alert-root],[class*=Paper-root],[class*=Card-root]')) && getComputedStyle(e).visibility !== 'hidden' })
      .slice(0, 5).map(e => ({ tag: e.tagName.toLowerCase(), w: Math.round(e.getBoundingClientRect().width), text: (e.textContent || '').trim().slice(0, 30), right: Math.round(e.getBoundingClientRect().right), path: path(e), clippedBy: clippedBy(e) }))
    const badges = [...root.querySelectorAll('.mantine-Badge-root')].filter(b => b.getBoundingClientRect().width > 0).map(b => ({ text: b.textContent.trim().slice(0, 20), path: path(b) }))
    return { past, badges }
  })
  await page.close()
}
await browser.close(); server.close()
await writeFile(new URL('./shellview-edge.json', import.meta.url), JSON.stringify(out, null, 1))
console.log(JSON.stringify(out, null, 1))
