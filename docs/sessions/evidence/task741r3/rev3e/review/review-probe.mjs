// Task 741 Revision 3e review (Opus, GR-9 + GR-3b/3c/3d): every ListingsShellView export, en + uk, 320/390/768/1024/1440,
// on the executor's final storybook-static. Records states, chips, pagination, buttons (Show more vs Save search),
// empty-state pattern, sort-bar line, gutters, fonts, overflow.
import { createRequire } from 'node:module'
import { createServer } from 'node:http'
import { readFile, writeFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
const require = createRequire('C:/Claude_Code_Projects/lero-al/package.json')
const { chromium } = require('playwright')
const dir = 'C:/Claude_Code_Projects/lero-al/storybook-static'
const D = 'docs/sessions/evidence/task741r3/rev3e/review/'
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg' }
const server = createServer(async (req, res) => { try { const p = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([\\/])+/, ''); const b = await readFile(join(dir, p || 'index.html')); res.writeHead(200, { 'content-type': MIME[extname(p)] ?? 'application/octet-stream' }); res.end(b) } catch { res.writeHead(404); res.end() } })
await new Promise(r => server.listen(0, r))
const base = `http://127.0.0.1:${server.address().port}`
const browser = await chromium.launch()
const out = { platform: process.platform, node: process.version, cells: {} }
const exportsList = ['default', 'closed-tab', 'closed-empty', 'empty', 'loading-more']
for (const ex of exportsList) for (const loc of ['en', 'uk']) for (const w of [320, 390, 768, 1024, 1440]) {
  const page = await browser.newPage({ viewport: { width: w, height: 900 }, deviceScaleFactor: 1 })
  await page.goto(`${base}/iframe.html?id=patterns-mantine-listingsshellview--${ex}&viewMode=story&globals=locale:${loc}`)
  await page.waitForSelector('#storybook-root .listings-shell', { timeout: 30000 })
  await page.waitForTimeout(1200)
  out.cells[`${ex}/${loc}@${w}`] = await page.evaluate(() => {
    const root = document.querySelector('#storybook-root')
    const vis = e => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' }
    const btn = re => {
      const b = [...root.querySelectorAll('button')].find(e => vis(e) && re.test((e.textContent || '').trim()))
      if (!b) return null
      const s = getComputedStyle(b), r = b.getBoundingClientRect()
      return { text: b.textContent.trim(), variant: b.dataset.variant, size: b.dataset.size ?? null, loading: b.hasAttribute('data-loading'), disabled: b.disabled || b.hasAttribute('data-disabled'), fs: s.fontSize, fw: s.fontWeight, h: Math.round(r.height), w: Math.round(r.width), radius: s.borderTopLeftRadius, bg: s.backgroundColor, color: s.color, cx: Math.round(r.left + r.width / 2) }
    }
    const cards = [...root.querySelectorAll('.listing-card')].filter(vis)
    const sortBar = root.querySelector('.listings-sort-bar')
    const hr = sortBar?.parentElement?.querySelector(':scope > .mantine-Divider-root')
    let t = Infinity, l = Infinity, r = -Infinity, b = -Infinity
    for (const e of root.querySelectorAll('*')) {
      if (!vis(e)) continue
      if (e.children.length && !e.matches('img,svg,button,input,hr,[class*=Divider-root],[class*=Card-root]')) continue
      const x = e.getBoundingClientRect()
      if (e.closest('.mantine-ScrollArea-viewport') && x.right > innerWidth) continue
      t = Math.min(t, x.top + scrollY); l = Math.min(l, x.left); r = Math.max(r, x.right); b = Math.max(b, x.bottom + scrollY)
    }
    let maxFont = 0
    for (const e of root.querySelectorAll('h1,h2,h3,h4,p,span,button')) { if (!vis(e) || !(e.textContent || '').trim()) continue; maxFont = Math.max(maxFont, parseFloat(getComputedStyle(e).fontSize)) }
    let empty = null
    if (cards.length === 0 && root.querySelector('.mantine-ThemeIcon-root')) {
      const st = root.querySelector('.mantine-ThemeIcon-root').closest('.mantine-Stack-root')
      const svg = st.querySelector('svg')
      empty = { texts: [...st.querySelectorAll('p')].map(p => `${p.textContent.trim()} | ${getComputedStyle(p).fontSize}/${getComputedStyle(p).fontWeight}`), icon: svg ? `${svg.getAttribute('class') || 'svg'} w${svg.getAttribute('width')}` : null, emoji: /🏠/.test(st.textContent) }
    }
    let sortLine = null
    if (hr) { const x = hr.getBoundingClientRect(), g = sortBar.getBoundingClientRect(), s = getComputedStyle(hr); sortLine = { gap: Math.round(x.top - g.bottom), h: Math.round(x.height), w: Math.round(x.width), gw: Math.round(g.width), color: s.borderTopColor, bw: s.borderTopWidth } }
    return {
      tabSelected: [...root.querySelectorAll('[role=tab][aria-selected=true]')].map(x => x.textContent.trim()).join(),
      chips: [...root.querySelectorAll('.active-filter-chips button')].filter(vis).map(c => c.textContent.trim()),
      filterCount: (root.querySelector('[data-testid=listings-mobile-filters-trigger]')?.textContent || '').replace(/\D/g, '') || null,
      cards: cards.map(c => ({ badges: [...c.querySelectorAll('.mantine-Badge-root')].map(x => x.textContent.trim()).join('+') || '-', overlay: !!c.querySelector('.mantine-Overlay-root'), placeholder: !c.querySelector('img'), fav: !!c.querySelector('[aria-pressed=true]'), premium: !!c.querySelector('[class*=premium]') })),
      pagination: [...root.querySelectorAll('.mantine-Pagination-control')].filter(vis).map(x => (x.textContent || '').trim() || '·'),
      paginationRoot: !!root.querySelector('.mantine-Pagination-root'),
      showMore: btn(/^(Show more|Показати ще)$/),
      saveSearch: btn(/^(Save search|Зберегти пошук)$/),
      sortLine, sortBarStyleAttr: sortBar?.getAttribute('style') || null,
      empty, overflow: document.documentElement.scrollWidth > innerWidth,
      gutter: [Math.round(t), Math.round(innerWidth - r), Math.round(document.documentElement.scrollHeight - b), Math.round(l)], maxFont,
    }
  })
  if (w === 390 || w === 1440) await page.screenshot({ path: `${D}${ex}-${loc}-${w}.png`, fullPage: true })
  await page.close()
}
await browser.close(); server.close()
await writeFile(D + 'review-probe.json', JSON.stringify(out, null, 1) + '\n')
for (const [k, v] of Object.entries(out.cells)) {
  const m = v.showMore, s = v.saveSearch
  console.log(k, '| tab', v.tabSelected, '| chips', v.chips.length, 'fc', v.filterCount,
    '| cards', v.cards.map(c => c.badges + (c.overlay ? '+OV' : '') + (c.placeholder ? '+PH' : '') + (c.fav ? '+FAV' : '') + (c.premium ? '+PREM' : '')).join(' '),
    '| pag', v.paginationRoot ? v.pagination.join(' ') : 'none',
    '| more', m ? `${m.variant}/${m.size}/${m.fs}/${m.fw}/h${m.h}/${m.radius}/${m.bg}/L${+m.loading}/w${m.w}` : '-',
    '| save', s ? `${s.fs}/${s.fw}/h${s.h}/${s.radius}` : '-',
    '| line', v.sortLine ? `${v.sortLine.gap}/${v.sortLine.h}/${v.sortLine.w}of${v.sortLine.gw}/${v.sortLine.color}/${v.sortLine.bw}` : '-', 'styleAttr', v.sortBarStyleAttr,
    '| empty', v.empty ? JSON.stringify(v.empty) : '-', '| ovf', v.overflow, '| g', v.gutter.join('/'), '| max', v.maxFont)
}
