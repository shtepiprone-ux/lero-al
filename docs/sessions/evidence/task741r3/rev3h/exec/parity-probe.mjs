// Task 741 Revision 3h (R66b / AC58) — rendered parity probe on a built Storybook.
// For `Patterns/Mantine/ListingCardPattern` and `Mantine/Primitives/ListingCard`, en and uk, at 768 and 1440: for every
// state, the card in the grid section and the card in the list section are compared part by part. For every text leaf
// inside every `data-card-part` node, the computed font-size, font-weight, line-height, color and letter-spacing must
// be equal. Writes parity.json (or the file named by PARITY_OUT) and exits 1 naming the first differing cell.
// Usage: node parity-probe.mjs            (reads ./storybook-static, writes rev3h/exec/parity.json)
//        STORYBOOK_DIR=<dir> PARITY_OUT=<file> node parity-probe.mjs
import { createRequire } from 'node:module'
import { createServer } from 'node:http'
import { readFile, writeFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
const require = createRequire('C:/Claude_Code_Projects/lero-al/package.json')
const { chromium } = require('playwright')
const dir = process.env.STORYBOOK_DIR ?? 'C:/Claude_Code_Projects/lero-al/storybook-static'
const OUT = process.env.PARITY_OUT ?? 'docs/sessions/evidence/task741r3/rev3h/exec/parity.json'
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp' }
const server = createServer(async (req, res) => { try { const p = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([\/\\])+/, ''); const b = await readFile(join(dir, p || 'index.html')); res.writeHead(200, { 'content-type': MIME[extname(p)] ?? 'application/octet-stream' }); res.end(b) } catch { res.writeHead(404); res.end() } })
await new Promise(r => server.listen(0, r))
const base = `http://127.0.0.1:${server.address().port}`
const browser = await chromium.launch()
const STORIES = ['patterns-mantine-listingcardpattern--default', 'mantine-primitives-listingcard--default']
const result = { platform: process.platform, node: process.version, cells: 0, compared: 0, diffs: [], tuples: {} }

const collect = () => {
  const root = document.querySelector('#storybook-root')
  const cards = [...root.querySelectorAll('.mantine-Card-root')]
  const inGrid = c => !!c.closest('.mantine-SimpleGrid-root')
  const grid = cards.filter(inGrid)
  const list = cards.filter(c => !inGrid(c))
  const leaves = card => {
    const out = {}
    for (const part of card.querySelectorAll('[data-card-part]')) {
      const name = part.getAttribute('data-card-part')
      out[name] = [...part.querySelectorAll('*')].filter(e => e.children.length === 0 && (e.textContent || '').trim()).map(e => {
        const s = getComputedStyle(e)
        return { text: e.textContent.trim(), fontSize: s.fontSize, fontWeight: s.fontWeight, lineHeight: s.lineHeight, color: s.color, letterSpacing: s.letterSpacing }
      })
    }
    return out
  }
  const visible = c => c.getBoundingClientRect().width > 0
  return { grid: grid.filter(visible).map(leaves), list: list.filter(visible).map(leaves) }
}

for (const id of STORIES) for (const loc of ['en', 'uk']) for (const w of [768, 1440]) {
  const page = await browser.newPage({ viewport: { width: w, height: 900 } })
  await page.goto(`${base}/iframe.html?id=${id}&viewMode=story&globals=locale:${loc}`)
  await page.waitForSelector('#storybook-root .mantine-Card-root', { timeout: 30000 })
  await page.waitForTimeout(2500)
  const { grid, list } = await page.evaluate(collect)
  const n = Math.min(grid.length, list.length)
  const key = `${id}@${loc}@${w}`
  result.cells++
  result.tuples[key] = { grid: grid.length, list: list.length, compared: n }
  for (let i = 0; i < n; i++) {
    const parts = new Set([...Object.keys(grid[i]), ...Object.keys(list[i])])
    for (const part of parts) {
      result.compared++
      const a = JSON.stringify(grid[i][part] ?? null), b = JSON.stringify(list[i][part] ?? null)
      if (a !== b) result.diffs.push({ cell: key, state: i + 1, part, grid: grid[i][part] ?? null, list: list[i][part] ?? null })
    }
  }
  await page.close()
}
await browser.close(); server.close()
await writeFile(OUT, JSON.stringify(result, null, 1) + '\n')
console.log(`parity: ${result.cells} cells, ${result.compared} part comparisons, ${result.diffs.length} differences`)
for (const d of result.diffs.slice(0, 10)) console.log(`DIFF ${d.cell} state ${d.state} part ${d.part}`)
for (const [k, v] of Object.entries(result.tuples)) console.log(k, JSON.stringify(v))
process.exit(result.diffs.length ? 1 : 0)
