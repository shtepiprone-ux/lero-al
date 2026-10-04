// Task 741 Revision 3e review — MantinePagination's width budget: row, its parent (Pagination.Root), and the consumer wrapper.
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
const out = {}
const stories = ['patterns-mantine-listingsshellview--default']
const idx = JSON.parse(await readFile(join(dir, 'index.json'), 'utf8'))
for (const [id, e] of Object.entries(idx.entries)) if (/pagination/i.test(id) && e.type === 'story') stories.push(id)
for (const id of stories) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await page.goto(`http://127.0.0.1:${server.address().port}/iframe.html?id=${id}&viewMode=story&globals=locale:en`)
  await page.waitForSelector('.mantine-Pagination-root', { timeout: 20000 }).catch(() => null)
  await page.waitForTimeout(1000)
  out[id] = await page.evaluate(() => [...document.querySelectorAll('.mantine-Pagination-root')].map(root => {
    const row = root.firstElementChild
    const desc = e => `${e.tagName.toLowerCase()}.${String(e.className).split(' ').filter(c => /mantine-(Pagination|Group|Stack|Box)/.test(c)).join('.')} w${Math.round(e.getBoundingClientRect().width)} client${e.clientWidth} display:${getComputedStyle(e).display}`
    return { rowParentIsRoot: row.parentElement === root, row: desc(row), root: desc(root), consumer: desc(root.parentElement), pages: [...row.querySelectorAll('.mantine-Pagination-control:not(.mantine-Pagination-edgeControl)')].filter(b => getComputedStyle(b).position !== 'fixed').map(b => b.textContent.trim()).join(' ') }
  }))
  await page.close()
}
await browser.close(); server.close()
await writeFile('docs/sessions/evidence/task741r3/rev3e/review/pagination-parent.json', JSON.stringify(out, null, 1) + '\n')
console.log(JSON.stringify(out, null, 1))
