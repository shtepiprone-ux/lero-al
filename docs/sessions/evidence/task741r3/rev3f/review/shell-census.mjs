// Task 741 O46-2 row 3 — GR-9 review of patterns-mantine-listingsshellview--default/--empty: rendered element census,
// states shown, and the "Show more" button vs the canonical Button. en, 390 and 1440, final 3c storybook-static.
import { createRequire } from 'node:module'
import { createServer } from 'node:http'
import { readFile, writeFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
const require = createRequire('C:/Claude_Code_Projects/lero-al/package.json')
const { chromium } = require('playwright')
const dir = 'C:/Claude_Code_Projects/lero-al/storybook-static'
const D = 'docs/sessions/evidence/task741r3/rev3f/review/'
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg' }
const server = createServer(async (req, res) => { try { const p = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([\/])+/, ''); const b = await readFile(join(dir, p || 'index.html')); res.writeHead(200, { 'content-type': MIME[extname(p)] ?? 'application/octet-stream' }); res.end(b) } catch { res.writeHead(404); res.end() } })
await new Promise(r => server.listen(0, r))
const base = `http://127.0.0.1:${server.address().port}`
const browser = await chromium.launch()
const out = {}
for (const id of ['patterns-mantine-listingsshellview--default', 'patterns-mantine-listingsshellview--empty']) {
  for (const w of [390, 1440]) {
    const page = await browser.newPage({ viewport: { width: w, height: 900 }, deviceScaleFactor: 1 })
    await page.goto(`${base}/iframe.html?id=${id}&viewMode=story&globals=locale:en`)
    await page.waitForSelector('#storybook-root .listings-shell', { timeout: 30000 })
    await page.waitForTimeout(1500)
    out[`${id.split('--')[1]}@${w}`] = await page.evaluate(() => {
      const root = document.querySelector('#storybook-root')
      const vis = e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden' }
      const cards = [...root.querySelectorAll('.listing-card')].filter(vis)
      const btns = [...root.querySelectorAll('button, a.mantine-Button-root')].filter(vis).map(b => { const s = getComputedStyle(b); return { text: (b.textContent || '').trim().slice(0, 30), aria: b.getAttribute('aria-label'), cls: [...b.classList].filter(c => c.startsWith('mantine-')).slice(0, 2).join(' '), size: b.getAttribute('data-size'), variant: b.getAttribute('data-variant'), h: Math.round(b.getBoundingClientRect().height), fs: s.fontSize, radius: s.borderTopLeftRadius, border: `${s.borderTopWidth} ${s.borderTopColor}`, bg: s.backgroundColor, color: s.color } })
      return {
        tabs: [...root.querySelectorAll('[role=tab]')].map(t => `${t.textContent.trim()}${t.getAttribute('aria-selected') === 'true' ? ' (selected)' : ''}`),
        chips: root.querySelectorAll('.active-filter-chips button').length,
        cards: cards.length,
        cardBadges: cards.map(c => [...c.querySelectorAll('.mantine-Badge-root')].map(b => b.textContent.trim()).join('+') || '-'),
        premium: cards.filter(c => c.querySelector('[class*=premium]')).length,
        favoritesOn: root.querySelectorAll('[aria-pressed=true]').length,
        pagination: !!root.querySelector('.mantine-Pagination-root'),
        emptyState: [...root.querySelectorAll('h3')].map(h => h.textContent.trim()).filter(t => !/Apartment|House|Villa|Studio|Office|Land|Room|Garage|Plot/i.test(t)).slice(0, 3),
        emoji: /🏠/.test(root.textContent),
        buttons: btns,
      }
    })
    await page.screenshot({ path: `${D}shell-${id.split('--')[1]}-${w}.png`, fullPage: true })
    await page.close()
  }
}
await browser.close(); server.close()
await writeFile(D + 'shell-census.json', JSON.stringify(out, null, 1) + '\n')
for (const [k, v] of Object.entries(out)) { console.log('==', k, 'tabs', v.tabs.join(' | '), 'chips', v.chips, 'cards', v.cards, 'premium', v.premium, 'fav', v.favoritesOn, 'pagination', v.pagination, 'empty', JSON.stringify(v.emptyState), 'emoji', v.emoji); console.log('   badges', v.cardBadges.join(' ; ')); for (const b of v.buttons) console.log('   btn', JSON.stringify(b)) }
