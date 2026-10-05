// Task 741 R3b — AC39 probe (evidence, not a gate). Usage: node probe-states.mjs <out.json>
// Serves storybook-static, opens both card Stories at 320/390/768/1440 x en/uk, records per grid card the badge texts,
// overlay presence, dimmed/premium/placeholder markers, and whether the list section is visible (and its card count).
// Pass B repeats the run with the browser clock fixed to 2027-03-01 to prove the badge texts do not depend on the wall clock.
import { createRequire } from 'node:module'
import { createServer } from 'node:http'
import { readFile, writeFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
const require = createRequire('C:/Claude_Code_Projects/lero-al/package.json')
const { chromium } = require('playwright')
const dir = 'C:/Claude_Code_Projects/lero-al/storybook-static'
const out = process.argv[2]
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg' }
const server = createServer(async (req, res) => { try { const p = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([\\/])+/, ''); const b = await readFile(join(dir, p || 'index.html')); res.writeHead(200, { 'content-type': MIME[extname(p)] ?? 'application/octet-stream' }); res.end(b) } catch { res.writeHead(404); res.end() } })
await new Promise(r => server.listen(0, r))
const base = `http://127.0.0.1:${server.address().port}`
// optional: argv[3]==='B' runs only the moved-clock pass; argv[4] restricts to one story id (used by the plant run)
const stories = process.argv[4] ? [process.argv[4]] : ['mantine-primitives-listingcard--default', 'patterns-mantine-listingcardpattern--default']
const browser = await chromium.launch()
const result = { platform: process.platform, node: process.version, passes: {} }

async function snapshot(page) {
  return page.evaluate(() => {
    const root = document.querySelector('#storybook-root')
    const grid = root.querySelector('.mantine-SimpleGrid-root')
    const visible = (e) => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return r.width > 0 && r.height > 0 && s.display !== 'none' && s.visibility !== 'hidden' }
    const gridCards = [...grid.children].map((c, i) => ({
      i: i + 1,
      badges: [...c.querySelectorAll('.mantine-Badge-root')].map(b => b.textContent.trim()),
      overlay: [...c.querySelectorAll('span')].some(s => getComputedStyle(s).rotate === '-8deg'),
      // the grid child is the card itself in the pattern Story and a link wrapper in the primitive Story: test self + descendants
      dimmed: c.matches('[class*="archived"]') || !!c.querySelector('[class*="archived"]'),
      premium: c.matches('[class*="premium"]') || !!c.querySelector('[class*="premium"]'),
      placeholder: !!c.querySelector('[data-testid="media-placeholder"]'),
    }))
    const titles = [...root.querySelectorAll('.mantine-Title-root')]
    const listTitle = titles[1]
    const listVisible = !!listTitle && visible(listTitle)
    let listCards = 0
    let listOverlays = 0
    let listBadges = []
    if (listVisible) {
      const listStack = listTitle.parentElement.querySelector(':scope > .mantine-Stack-root')
      const cards = [...(listStack?.children ?? [])]
      listCards = cards.length
      listOverlays = cards.filter(c => [...c.querySelectorAll('span')].some(s => getComputedStyle(s).rotate === '-8deg')).length
      listBadges = cards.map(c => [...c.querySelectorAll('.mantine-Badge-root')].map(b => b.textContent.trim()))
    }
    return { gridCount: gridCards.length, gridCards, listVisible, listCards, listOverlays, listBadges, overflow: document.documentElement.scrollWidth > innerWidth }
  })
}

const ONLY_B = process.argv[3] === 'B'
for (const [passName, fixed] of [['A_real_clock', null], ['B_clock_2027-03-01', '2027-03-01T00:00:00.000Z']]) {
  if (ONLY_B && !fixed) continue
  result.passes[passName] = {}
  for (const id of stories) {
    result.passes[passName][id] = {}
    for (const loc of ['en', 'uk']) {
      for (const w of [320, 390, 768, 1440]) {
        const page = await browser.newPage({ viewport: { width: w, height: 900 }, deviceScaleFactor: 1 })
        if (fixed) await page.clock.setFixedTime(new Date(fixed))
        await page.goto(`${base}/iframe.html?id=${id}&viewMode=story&globals=locale:${loc}`)
        await page.waitForSelector('#storybook-root .mantine-SimpleGrid-root .mantine-Badge-root', { timeout: 30000 })
        await page.waitForTimeout(1200)
        result.passes[passName][id][`${loc}@${w}`] = await snapshot(page)
        await page.close()
      }
    }
  }
}
await browser.close(); server.close()
await writeFile(out, JSON.stringify(result, null, 2) + '\n', 'utf8')
console.log('written', out)
