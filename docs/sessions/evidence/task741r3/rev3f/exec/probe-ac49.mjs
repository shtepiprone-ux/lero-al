// Task 741 Revision 3f — AC49 probe on the final storybook-static: visible page numbers of every paginator, per Story,
// at 320/390/1440 (en) and 390/1440 (uk), plus row geometry and overflow. A control is visible when it is not the probe
// (not position: fixed) and sits inside the row's box.
import { createRequire } from 'node:module'
import { createServer } from 'node:http'
import { readFile, writeFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
const require = createRequire('C:/Claude_Code_Projects/lero-al/package.json')
const { chromium } = require('playwright')
const dir = 'C:/Claude_Code_Projects/lero-al/storybook-static'
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp' }
const server = createServer(async (req, res) => { try { const p = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([\/])+/, ''); const b = await readFile(join(dir, p || 'index.html')); res.writeHead(200, { 'content-type': MIME[extname(p)] ?? 'application/octet-stream' }); res.end(b) } catch { res.writeHead(404); res.end() } })
await new Promise(r => server.listen(0, r))
const browser = await chromium.launch()
const idx = JSON.parse(await readFile(join(dir, 'index.json'), 'utf8'))
const stories = Object.entries(idx.entries).filter(([id, e]) => e.type === 'story' && /pagination|listingsshellview--(default|loading-more)|adminlistingsview|agentstatisticsview|adminsurfacepattern/i.test(id)).map(([id]) => id)
const out = {}
for (const id of stories) for (const [loc, w] of [['en', 320], ['en', 390], ['en', 1440], ['uk', 390], ['uk', 1440]]) {
  const page = await browser.newPage({ viewport: { width: w, height: 900 } })
  await page.goto(`http://127.0.0.1:${server.address().port}/iframe.html?id=${id}&viewMode=story&globals=locale:${loc}`)
  await page.waitForSelector('.mantine-Pagination-root', { timeout: 15000 }).catch(() => null)
  await page.waitForTimeout(1200)
  out[`${id}@${loc}@${w}`] = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth > innerWidth,
    pagers: [...document.querySelectorAll('.mantine-Pagination-root')].map(root => {
      const row = root.firstElementChild
      const rr = row.getBoundingClientRect()
      const cs = getComputedStyle(row)
      const pages = [...row.querySelectorAll('.mantine-Pagination-control:not(.mantine-Pagination-edgeControl)')].filter(b => { const s = getComputedStyle(b), r = b.getBoundingClientRect(); return s.position !== 'fixed' && r.width > 0 && r.left >= rr.left - 1 && r.right <= rr.right + 1 }).map(b => b.textContent.trim())
      const probe = [...row.querySelectorAll('[aria-hidden="true"]')][0]
      const ps = probe && getComputedStyle(probe)
      return { pages: pages.join(' '), rowW: Math.round(rr.width), rootW: Math.round(root.getBoundingClientRect().width), parentW: Math.round(root.parentElement.getBoundingClientRect().width), row: { display: cs.display, flexWrap: cs.flexWrap, gap: cs.columnGap, overflow: cs.overflow, maxWidth: cs.maxWidth, styleAttr: row.getAttribute('style') }, probe: probe ? { position: ps.position, visibility: ps.visibility, pointerEvents: ps.pointerEvents } : null }
    }),
  }))
  if (/pagination--in-centered-group|listingsshellview--default$/.test(id) && loc === 'en') await page.screenshot({ path: `docs/sessions/evidence/task741r3/rev3f/exec/ac49-${id.replace(/.*--/, '')}-${w}.png`, fullPage: true })
  await page.close()
}
await browser.close(); server.close()
await writeFile('docs/sessions/evidence/task741r3/rev3f/exec/probe-ac49.json', JSON.stringify(out, null, 1) + '\n')
for (const [k, v] of Object.entries(out)) console.log(k, v.overflow ? 'OVERFLOW' : 'ok', v.pagers.map(p => `[${p.pages}] row${p.rowW}/parent${p.parentW}`).join(' | '))
