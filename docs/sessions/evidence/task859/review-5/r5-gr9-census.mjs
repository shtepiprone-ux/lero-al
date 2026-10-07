// Task 859 review 5: GR-9 census of every O78-13 matrix Story on the storybook-static rebuilt this session.
// Per Story, sq, 1440 and 390: (1) census of rendered Mantine roots inside the story root and every open overlay;
// (2) non-canonical markers: Tailwind-shaped class tokens, inline styles with raw px / hex / rgb values; (3) the dialog's
// buttons (label, variant, filled?) and text buttons sharing a row (GR-3e); (4) parity 390 vs 1440: the same component
// multiset and the same button labels. State coverage (GR-9 step 3) is judged against each View's props in the review.
import { createRequire } from 'node:module'
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
const require = createRequire('C:/Claude_Code_Projects/lero-al/package.json')
const { chromium } = require('playwright')
const ROOT = 'C:/Claude_Code_Projects/lero-al/storybook-static'
const OUT = 'C:/Claude_Code_Projects/lero-al/docs/sessions/evidence/task859/review-5/r5-gr9-census.json'
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp' }
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]))
  fs.readFile(p, (e, d) => { if (e) { res.writeHead(404); res.end(); return } res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] ?? 'application/octet-stream' }); res.end(d) })
}).listen(6151)
const index = JSON.parse(fs.readFileSync(path.join(ROOT, 'index.json'), 'utf8'))
const KEYS = ['admincurrenciesview', 'admindashboardrecentlistings', 'adminexchangeprovidersview', 'adminpagesview', 'adminuserprofiledialogsview', 'createticketdialogview', 'currencydetaildialogview', 'currencyformdialogview', 'inquirydetaildialogview', 'listingpreviewdialogview', 'pageeditordialogview', 'premiumdialogview', 'providerformdialogview', 'reportdetaildialogview', 'ticketdetaildialogview', 'avatarcropmodal', 'richtexteditor', 'collectionssection', 'savesearchbutton', 'savetocollectionbutton', 'userpickerfieldview', 'mantine-primitives-badge--', 'mantine-primitives-modal--', 'adminuserstable', 'notificationpattern', 'responsivebottomsheet', 'primitives-select--mobile', 'mantine-primitives-combobox--']
const ids = Object.values(index.entries).filter(e => e.type === 'story').map(e => e.id).filter(id => KEYS.some(k => id.includes(k)))
const TW = /^(flex|inline-flex|grid|block|hidden|items-|justify-|gap-|space-[xy]-|p[trblxy]?-\d|m[trblxy]?-\d|text-(xs|sm|base|lg|xl|\d)|font-|bg-|w-|h-|min-|max-|rounded|border|shadow|truncate|leading-|tracking-|overflow-)/
const browser = await chromium.launch()
const rows = []
for (const id of ids) {
  const per = {}
  for (const width of [1440, 390]) {
    const ctx = await browser.newContext({ viewport: { width, height: 900 } })
    const page = await ctx.newPage()
    const errors = []
    page.on('pageerror', e => errors.push(String(e.message).slice(0, 160)))
    let ok = true
    await page.goto(`http://127.0.0.1:6151/iframe.html?id=${id}&globals=locale:sq&viewMode=story`).catch(() => { ok = false })
    await page.waitForTimeout(2500)
    const r = ok ? await page.evaluate(TWsrc => {
      const TW = new RegExp(TWsrc)
      const scopes = [document.querySelector('#storybook-root'), ...document.querySelectorAll('[data-portal="true"], .mantine-Portal')].filter(Boolean)
      const all = scopes.flatMap(s => [s, ...s.querySelectorAll('*')])
      const visible = el => { const b = el.getBoundingClientRect(); return b.width > 0 && b.height > 0 }
      const comps = {}
      const nonCanonical = []
      for (const el of all) {
        if (!visible(el)) continue
        const cls = typeof el.className === 'string' ? el.className.split(/\s+/).filter(Boolean) : []
        for (const c of cls) { const m = c.match(/^mantine-([A-Za-z]+)-root$/); if (m) comps[m[1]] = (comps[m[1]] || 0) + 1 }
        const tw = cls.filter(c => TW.test(c))
        if (tw.length) nonCanonical.push({ tag: el.tagName, tw: tw.slice(0, 5).join(' ') })
        const st = el.getAttribute('style') || ''
        const raw = st.split(';').map(s => s.trim()).filter(s => s && !s.startsWith('--') && /(#[0-9a-f]{3,8}\b|rgba?\(|\b\d+(\.\d+)?px\b)/i.test(s) && !/var\(--/.test(s))
        if (raw.length && !['svg', 'path', 'img', 'canvas'].includes(el.tagName.toLowerCase())) nonCanonical.push({ tag: el.tagName, style: raw.slice(0, 3).join('; ') })
      }
      const dialog = [...document.querySelectorAll('.mantine-Modal-content, .mantine-Drawer-content')].find(visible)
      let buttons = []; let sharedRows = 0; let filledPrimary = 0
      if (dialog) {
        const bs = [...dialog.querySelectorAll('button')].filter(visible)
        buttons = bs.map(b => ({ label: (b.innerText || b.getAttribute('aria-label') || '').trim().slice(0, 30), variant: b.getAttribute('data-variant'), bg: getComputedStyle(b).backgroundColor, y: Math.round(b.getBoundingClientRect().y) }))
        filledPrimary = buttons.filter(b => b.variant === 'filled').length
        const text = bs.filter(b => ['subtle', 'transparent'].includes(b.getAttribute('data-variant')) && (b.innerText || '').trim())
        const ys = {}; for (const b of text) { const y = Math.round(b.getBoundingClientRect().y); ys[y] = (ys[y] || 0) + 1 }
        sharedRows = Object.values(ys).filter(n => n > 1).length
      }
      return { comps, nonCanonical: nonCanonical.slice(0, 12), nonCanonicalCount: nonCanonical.length, dialogOpen: !!dialog, buttons, filledPrimary, textButtonsSharingRow: sharedRows }
    }, TW.source) : null
    per[width] = { ...r, errors }
    await ctx.close()
  }
  const a = per[1440], b = per[390]
  const sameComps = a && b && JSON.stringify(Object.keys(a.comps || {}).filter(k => !['Drawer', 'Modal', 'ModalBase', 'Overlay'].includes(k)).sort()) === JSON.stringify(Object.keys(b.comps || {}).filter(k => !['Drawer', 'Modal', 'ModalBase', 'Overlay'].includes(k)).sort())
  const sameButtons = a && b && JSON.stringify((a.buttons || []).map(x => x.label).filter(l => l && !/^(Mbyll|Close)$/.test(l)).sort()) === JSON.stringify((b.buttons || []).map(x => x.label).filter(l => l && !/^(Mbyll|Close)$/.test(l)).sort())
  rows.push({ id, w1440: a, w390: b, parity: { sameComps, sameButtons } })
  console.log(id.padEnd(66), 'comps', Object.keys(a?.comps || {}).length, 'nonCanon', a?.nonCanonicalCount, '/', b?.nonCanonicalCount, 'dialog', a?.dialogOpen, 'filled', a?.filledPrimary, 'shareRow', a?.textButtonsSharingRow, '/', b?.textButtonsSharingRow, 'parity', sameComps, sameButtons, 'err', (a?.errors.length || 0) + (b?.errors.length || 0))
}
fs.writeFileSync(OUT, JSON.stringify({ platform: process.platform, node: process.version, locale: 'sq', stories: rows.length, rows }, null, 1))
await browser.close()
server.close()
