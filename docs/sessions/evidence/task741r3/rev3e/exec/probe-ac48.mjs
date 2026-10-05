// Task 741 Rev 3e — AC48 probe on the final storybook-static: states of every ListingsShellView export, en/uk, 390 and 1440.
import { createRequire } from 'node:module'
import { createServer } from 'node:http'
import { readFile, writeFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
const require = createRequire('C:/Claude_Code_Projects/lero-al/package.json')
const { chromium } = require('playwright')
const dir = 'C:/Claude_Code_Projects/lero-al/storybook-static'
const D = 'docs/sessions/evidence/task741r3/rev3e/exec/'
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg' }
const server = createServer(async (req, res) => { try { const p = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([\/])+/, ''); const b = await readFile(join(dir, p || 'index.html')); res.writeHead(200, { 'content-type': MIME[extname(p)] ?? 'application/octet-stream' }); res.end(b) } catch { res.writeHead(404); res.end() } })
await new Promise(r => server.listen(0, r))
const base = `http://127.0.0.1:${server.address().port}`
const browser = await chromium.launch()
const out = {}
for (const ex of ['default', 'closed-tab', 'closed-empty', 'empty', 'loading-more']) for (const loc of ['en', 'uk']) for (const w of [390, 1440]) {
  const page = await browser.newPage({ viewport: { width: w, height: 900 }, deviceScaleFactor: 1 })
  await page.goto(`${base}/iframe.html?id=patterns-mantine-listingsshellview--${ex}&viewMode=story&globals=locale:${loc}`)
  await page.waitForSelector('#storybook-root .listings-shell', { timeout: 30000 })
  await page.waitForTimeout(1500)
  out[`${ex}@${loc}@${w}`] = await page.evaluate(() => {
    const root = document.querySelector('#storybook-root')
    const vis = e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden' }
    const cards = [...root.querySelectorAll('.listing-card')].filter(vis)
    const bs = b => { const s = getComputedStyle(b), r = b.getBoundingClientRect(); return { text: (b.textContent || '').trim().slice(0, 30), variant: b.getAttribute('data-variant'), size: b.getAttribute('data-size'), loading: b.hasAttribute('data-loading'), disabled: b.disabled, h: Math.round(r.height), w: Math.round(r.width), fs: s.fontSize, radius: s.borderTopLeftRadius, bg: s.backgroundColor } }
    const more = [...root.querySelectorAll('button')].filter(vis).find(b => b.closest('div')?.parentElement && /show more|показати більше|shfaq më shumë|mostra altro/i.test(b.textContent || ''))
    const save = [...root.querySelectorAll('button')].filter(vis).find(b => /save search|зберегти пошук|ruaj kërkimin|salva ricerca/i.test(b.textContent || ''))
    const sortBar = root.querySelector('.listings-sort-bar')
    const line = sortBar?.nextElementSibling
    return {
      tab: [...root.querySelectorAll('[role=tab][aria-selected=true]')].map(t => t.textContent.trim()).join(','),
      cards: cards.length,
      cardBadges: cards.map(c => [...c.querySelectorAll('.mantine-Badge-root')].map(b => b.textContent.trim()).join('+') || '-'),
      overlays: cards.filter(c => [...c.querySelectorAll('span')].some(s => getComputedStyle(s).rotate === '-8deg')).length,
      placeholders: cards.filter(c => c.querySelector('[data-testid="media-placeholder"]')).length,
      favourites: root.querySelectorAll('[aria-pressed=true]').length,
      chips: root.querySelectorAll('.active-filter-chips button').length,
      paginationPages: root.querySelectorAll('.mantine-Pagination-control:not([data-with-padding]) , .mantine-Pagination-root [data-active]').length ? [...root.querySelectorAll('.mantine-Pagination-control')].map(b => b.textContent.trim()).filter(Boolean).join(',') : null,
      showMore: more ? bs(more) : null,
      saveSearch: save ? bs(save) : null,
      empty: [...root.querySelectorAll('p, h3')].map(h => h.textContent.trim()).filter(t => /no |немає|nuk |nessun|не знайд|listings|оголош/i.test(t) && t.length < 80).slice(0, 4),
      emoji: /🏠/.test(root.textContent),
      sortLine: line ? { cls: line.className.slice(0, 40), h: Math.round(line.getBoundingClientRect().height), y: Math.round(line.getBoundingClientRect().top), color: getComputedStyle(line).borderTopColor, bw: getComputedStyle(line).borderTopWidth } : null,
      overflow: document.documentElement.scrollWidth > innerWidth,
    }
  })
  if (loc === 'en') await page.screenshot({ path: `${D}ac48-${ex}-${w}.png`, fullPage: true })
  await page.close()
}
await browser.close(); server.close()
await writeFile(D + 'probe-ac48.json', JSON.stringify(out, null, 1) + '\n')
for (const [k, v] of Object.entries(out)) console.log(k, 'tab', v.tab, 'cards', v.cards, 'badges', v.cardBadges.join(';'), 'ovl', v.overlays, 'ph', v.placeholders, 'fav', v.favourites, 'chips', v.chips, 'pag', v.paginationPages, 'more', v.showMore && `${v.showMore.variant}/${v.showMore.fs}/${v.showMore.h}/${v.showMore.loading}`, 'save', v.saveSearch && `${v.saveSearch.fs}/${v.saveSearch.h}/${v.saveSearch.radius}`, 'empty', JSON.stringify(v.empty), 'emoji', v.emoji, 'line', JSON.stringify(v.sortLine), 'ovf', v.overflow)
