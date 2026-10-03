// Revision 7 AC24-AC29 measurements on storybook-static (DPR 1). Output: 114-measurements-r7.json
import { createRequire } from 'node:module'
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
const require = createRequire('C:/Claude_Code_Projects/lero-al/package.json')
const { chromium } = require('playwright')
const ROOT = 'C:/Claude_Code_Projects/lero-al/storybook-static'
const EV = 'C:/Claude_Code_Projects/lero-al/docs/sessions/evidence/task857'
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png' }
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]))
  fs.readFile(p, (e, d) => { if (e) { res.writeHead(404); res.end(); return } res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] ?? 'application/octet-stream' }); res.end(d) })
}).listen(6121)
const browser = await chromium.launch()
const out = { dialogs: [], patterns: [], modalStructured: {}, radioCard: [], radioCardFocus: null }
const url = (id, loc) => `http://127.0.0.1:6121/iframe.html?id=${id}&globals=locale:${loc}&viewMode=story`
const open = async (vw, vh = 900) => (await browser.newContext({ deviceScaleFactor: 1, viewport: { width: vw, height: vh } })).newPage()

// ── dialogs: AC28/AC29
const dlg = [
  ...['active', 'premium', 'hidden', 'sold-status-actions', 'no-photo-no-features', 'delete-confirm'].map(s => `patterns-mantine-listingpreviewdialogview--${s}`),
  ...['not-premium', 'premium', 'premium-active', 'custom-date', 'saving'].map(s => `patterns-mantine-premiumdialogview--${s}`),
]
for (const id of dlg) for (const loc of ['sq', 'uk']) for (const vw of [390, 1440]) {
  const page = await open(vw)
  await page.goto(url(id, loc)); await page.waitForSelector('[role=dialog]', { timeout: 20000 }); await page.waitForTimeout(1200)
  out.dialogs.push({ id, loc, vw, ...(await page.evaluate(() => {
    const d = document.querySelector('[role=dialog]'); const q = (s) => [...d.querySelectorAll(s)]
    const dr = d.getBoundingClientRect()
    const btns = q('.mantine-Button-root').map(b => { const r = b.getBoundingClientRect(); return { t: b.textContent.trim(), v: b.getAttribute('data-variant') || 'filled', w: Math.round(r.width), h: Math.round(r.height), top: Math.round(r.top), nav: false } })
    const footer = btns.filter(b => b.top > dr.bottom - 140)
    const sectionTitles = q('.mantine-Text-root').filter(x => getComputedStyle(x).fontWeight === '500' && parseFloat(getComputedStyle(x).fontSize) === 16).map(x => x.textContent.trim())
    return {
      sectionTitles,
      footerButtons: footer,
      bodyButtons: btns.filter(b => !footer.includes(b)).map(b => b.t),
      navRows: q('[data-nav-row]').map(r => ({ h: Math.round(r.getBoundingClientRect().height), rel: r.getAttribute('rel'), t: r.textContent.trim().slice(0, 30) })),
      radios: q('[role=radio]').map(r => ({ checked: r.getAttribute('aria-checked'), disabled: r.disabled })),
      closeBtn: !!d.querySelector('.mantine-ActionIcon-root'),
      badges: q('.mantine-Badge-root').map(b => b.textContent.trim()),
      hasImg: !!d.querySelector('img'),
      overflowX: document.documentElement.scrollWidth > innerWidth,
      dialogW: Math.round(dr.width),
    }
  })) })
  await page.context().close()
}

// ── patterns: AC25
const patternIds = ['dialogsections--default', 'dialogsections--single-section', 'detaillist--default', 'detaillist--single-row', 'navrowlist--default', 'dialogfooter--default', 'dialogfooter--single-button'].map(s => `patterns-mantine-${s}`)
for (const id of patternIds) for (const loc of ['sq', 'uk']) for (const vw of [320, 390, 1024, 1440]) {
  const page = await open(vw)
  await page.goto(url(id, loc)); await page.waitForSelector('#storybook-root > *', { state: 'attached', timeout: 20000 }); await page.waitForTimeout(1000)
  out.patterns.push({ id, loc, vw, ...(await page.evaluate(() => {
    const root = document.querySelector('#storybook-root')
    const card = root.querySelector('.mantine-Card-root'); const cr = card?.getBoundingClientRect()
    return {
      overflowX: document.documentElement.scrollWidth > innerWidth,
      card: cr ? [Math.round(cr.left), Math.round(cr.right)] : null,
      dividers: [...root.querySelectorAll('.mantine-Divider-root')].map(h => { const r = h.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.right)] }),
      rows: [...root.querySelectorAll('[data-nav-row]')].map(r => ({ h: Math.round(r.getBoundingClientRect().height), rel: r.getAttribute('rel'), target: r.getAttribute('target') })),
      btns: [...root.querySelectorAll('.mantine-Button-root')].map(b => ({ w: Math.round(b.getBoundingClientRect().width), h: Math.round(b.getBoundingClientRect().height) })),
      papers: [...root.querySelectorAll('.mantine-Paper-root')].map(p => { const r = p.getBoundingClientRect(); return { l: Math.round(r.left), r: Math.round(r.right), clipped: p.scrollWidth > p.clientWidth + 1 } }),
    }
  })) })
  await page.context().close()
}

// ── Modal Structured: AC24
for (const vw of [1440, 390]) {
  const page = await open(vw)
  await page.goto(url('mantine-primitives-modal--structured', 'sq')); await page.waitForSelector('button', { state: 'attached' }); await page.waitForTimeout(800)
  await page.getByRole('button').first().click(); await page.waitForSelector('[role=dialog]'); await page.waitForTimeout(900)
  out.modalStructured[vw] = await page.evaluate(() => {
    const d = document.querySelector('[role=dialog]'); const dr = d.getBoundingClientRect()
    const texts = [...d.querySelectorAll('.mantine-Text-root')]
    const f = (el) => el && { size: getComputedStyle(el).fontSize, weight: getComputedStyle(el).fontWeight, text: el.textContent.slice(0, 30) }
    const x = d.querySelector('.mantine-ActionIcon-root'); const xr = x?.getBoundingClientRect()
    const content = d.closest('.mantine-Modal-content') ?? d
    const cr = content.getBoundingClientRect()
    return {
      content: { left: Math.round(cr.left), right: Math.round(cr.right), w: Math.round(cr.width) },
      title18: f(texts.find(t => parseFloat(getComputedStyle(t).fontSize) === 18)),
      desc14: f(texts.find(t => parseFloat(getComputedStyle(t).fontSize) === 14)),
      all14pxBoldTitleText: texts.filter(t => parseFloat(getComputedStyle(t).fontSize) === 14 && getComputedStyle(t).fontWeight === '600').map(t => t.textContent.slice(0, 20)),
      dividers: [...d.querySelectorAll('.mantine-Divider-root')].map(e => { const r = e.getBoundingClientRect(); return { left: Math.round(r.left), right: Math.round(r.right) } }),
      close: xr ? { w: Math.round(xr.width), h: Math.round(xr.height), radius: getComputedStyle(x).borderRadius, rightGap: Math.round(cr.right - xr.right) } : null,
      dragHandle: !!d.querySelector('.mantine-Drawer-header'),
    }
  })
  await page.screenshot({ path: `${EV}/114-modal-structured-${vw}.png` })
  await page.context().close()
}

// ── Radio Card: AC26 + circle crops (GR-3f)
{
  const crops = []
  const page = await open(1440, 1000)
  await page.goto(url('mantine-primitives-radio--card', 'sq')); await page.waitForSelector('[role=radio]'); await page.waitForTimeout(1000)
  out.radioCard = await page.evaluate(() => [...document.querySelectorAll('.mantine-RadioCard-card')].map(c => {
    const i = c.querySelector('.mantine-RadioIndicator-indicator'); const ic = c.querySelector('.mantine-RadioIndicator-icon')
    const cs = getComputedStyle(c), is = getComputedStyle(i), ics = getComputedStyle(ic)
    const ir = i.getBoundingClientRect(), icr = ic.getBoundingClientRect()
    return { checked: c.getAttribute('aria-checked'), disabled: c.disabled, border: cs.borderColor, bg: cs.backgroundColor, opacity: cs.opacity, radius: cs.borderRadius, padding: cs.padding, ind: [Math.round(ir.width), Math.round(ir.height)], indBg: is.backgroundColor, indBorder: is.borderColor, dot: [Math.round(icr.width), Math.round(icr.height)], dotColor: ics.color, dotOpacity: ics.opacity }
  }))
  const cards = await page.$$('.mantine-RadioCard-card')
  await cards[2].focus(); await page.keyboard.press('Shift+Tab'); await page.keyboard.press('Tab'); await page.waitForTimeout(250)
  out.radioCardFocus = await page.evaluate(() => { const c = document.activeElement; return { role: c.getAttribute('role'), focusVisible: c.matches(':focus-visible'), border: getComputedStyle(c).borderColor, shadow: getComputedStyle(c).boxShadow } })
  await page.evaluate(() => document.activeElement?.blur())
  const ind = await page.$$('.mantine-RadioIndicator-indicator')
  for (let i = 0; i < ind.length; i++) { const b = await ind[i].boundingBox(); crops.push([`card indicator #${i + 1}`, (await page.screenshot({ clip: { x: b.x - 6, y: b.y - 6, width: b.width + 12, height: b.height + 12 } })).toString('base64')]) }
  await page.context().close()

  const p2 = await open(1440)
  await p2.goto(url('mantine-primitives-modal--structured', 'sq')); await p2.waitForSelector('button', { state: 'attached' }); await p2.getByRole('button').first().click(); await p2.waitForSelector('[role=dialog]'); await p2.waitForTimeout(900)
  await p2.evaluate(() => document.activeElement?.blur()); await p2.waitForTimeout(300)
  const x = await p2.$('[role=dialog] .mantine-ActionIcon-root'); const xb = await x.boundingBox()
  crops.push(['close button (round)', (await p2.screenshot({ clip: { x: xb.x - 6, y: xb.y - 6, width: xb.width + 12, height: xb.height + 12 } })).toString('base64')])
  await p2.context().close()

  const p3 = await open(1440)
  await p3.goto(url('patterns-mantine-premiumdialogview--saving', 'sq')); await p3.waitForSelector('[role=radio]'); await p3.waitForTimeout(1000)
  const pi = await p3.$$('.mantine-RadioIndicator-indicator')
  for (let i = 0; i < Math.min(2, pi.length); i++) { const b = await pi[i].boundingBox(); crops.push([`saving card #${i + 1}`, (await p3.screenshot({ clip: { x: b.x - 6, y: b.y - 6, width: b.width + 12, height: b.height + 12 } })).toString('base64')]) }
  await p3.context().close()

  const html = `<body style="margin:12px;font:13px sans-serif;background:#fff;display:flex;flex-wrap:wrap;gap:16px">${crops.map(([n, b]) => `<div style="width:200px"><div>${n}</div><img src="data:image/png;base64,${b}" style="image-rendering:pixelated;width:200px"></div>`).join('')}</body>`
  const p4 = await open(1000, 800); await p4.setContent(html); await p4.waitForTimeout(300)
  await p4.screenshot({ path: `${EV}/115-circles-r7.png`, fullPage: true }); await p4.context().close()
}
fs.writeFileSync(`${EV}/114-measurements-r7.json`, JSON.stringify(out, null, 2))
await browser.close(); server.close(); console.log('ok')
