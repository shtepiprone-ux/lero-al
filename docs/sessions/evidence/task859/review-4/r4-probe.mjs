// Task 859 review 4: reviewer probes on the storybook-static rebuilt this session (r4-build-storybook.txt).
// AC28 badge fill/text = palette 0/7; AC29 dialog radius, close size and sheet top radius; AC30 stacked confirm and what
// the dialog underneath exposes (ListingPreview vs ReportDetail); Lightbox fullScreen radius (blast radius of the Modal
// radius default); bottom-sheet consumers' top radius (blast radius of bottomSheetDrawerStyles).
import { createRequire } from 'node:module'
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
const require = createRequire('C:/Claude_Code_Projects/lero-al/package.json')
const { chromium } = require('playwright')
const ROOT = 'C:/Claude_Code_Projects/lero-al/storybook-static'
const OUT = 'C:/Claude_Code_Projects/lero-al/docs/sessions/evidence/task859/review-4/r4-probe.json'
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp' }
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]))
  fs.readFile(p, (e, d) => { if (e) { res.writeHead(404); res.end(); return } res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] ?? 'application/octet-stream' }); res.end(d) })
}).listen(6141)
const browser = await chromium.launch()
const out = { platform: process.platform, node: process.version, builtAt: fs.statSync(path.join(ROOT, 'index.json')).mtime, rows: [] }
async function open(id, width, locale = 'en') {
  const ctx = await browser.newContext({ viewport: { width, height: 900 } })
  const page = await ctx.newPage()
  await page.goto(`http://127.0.0.1:6141/iframe.html?id=${id}&globals=locale:${locale}&viewMode=story`)
  await page.waitForTimeout(3500)
  return { ctx, page }
}

// 1. AC28
for (const locale of ['en', 'uk']) {
  const { ctx, page } = await open('mantine-primitives-badge--statuses', 1440, locale)
  const r = await page.evaluate(() => {
    const css = getComputedStyle(document.documentElement)
    const toRgb = v => { const d = document.createElement('div'); d.style.color = v; document.body.appendChild(d); const c = getComputedStyle(d).color; d.remove(); return c }
    return [...document.querySelectorAll('.mantine-Badge-root[data-variant="light"]')].map(b => {
      const m = (b.getAttribute('style') || '').match(/--mantine-color-([a-zA-Z]+)-0/)
      const name = m ? m[1] : null
      const s = getComputedStyle(b)
      const want0 = name ? toRgb(css.getPropertyValue(`--mantine-color-${name}-0`).trim()) : null
      const want7 = name ? toRgb(css.getPropertyValue(`--mantine-color-${name}-7`).trim()) : null
      return { text: b.innerText.trim(), name, bg: s.backgroundColor, color: s.color, ok: !!name && s.backgroundColor === want0 && s.color === want7 }
    })
  })
  out.rows.push({ probe: 'AC28', locale, n: r.length, failing: r.filter(x => !x.ok), sample: r.slice(0, 4) })
  console.log('AC28', locale, 'light badges', r.length, 'failing', r.filter(x => !x.ok).length)
  await ctx.close()
}

// 2. AC29
for (const id of ['mantine-primitives-modal--detail', 'mantine-primitives-modal--form', 'mantine-primitives-modal--delete-confirm', 'mantine-primitives-modal--default']) {
  for (const width of [1440, 390]) {
    const { ctx, page } = await open(id, width)
    if (!(await page.locator('.mantine-Modal-content, .mantine-Drawer-content').count())) {
      await page.locator('button').first().click().catch(() => null)
      await page.waitForTimeout(1200)
    }
    const r = await page.evaluate(() => {
      const c = document.querySelector('.mantine-Modal-content') || document.querySelector('.mantine-Drawer-content')
      if (!c) return null
      const s = getComputedStyle(c)
      const close = c.querySelector('button[aria-label]')
      const cr = close ? close.getBoundingClientRect() : null
      return { kind: c.className.includes('Drawer') ? 'sheet' : 'modal', tl: s.borderTopLeftRadius, tr: s.borderTopRightRadius, bl: s.borderBottomLeftRadius, close: cr ? `${Math.round(cr.width)}x${Math.round(cr.height)}` : null, closeLabel: close?.getAttribute('aria-label') }
    })
    out.rows.push({ probe: 'AC29', id, width, r })
    console.log('AC29', id, width, JSON.stringify(r))
    await ctx.close()
  }
}

// 3. AC30 + the covered contract across both stacked confirms
for (const id of ['patterns-mantine-listingpreviewdialogview--delete-confirm', 'patterns-mantine-reportdetaildialogview--delete-confirm']) {
  for (const width of [1440, 390]) {
    const { ctx, page } = await open(id, width)
    const roots = await page.evaluate(() => [...document.querySelectorAll('.mantine-Modal-root, .mantine-Drawer-root')].map(rt => ({
      cls: rt.className.split(' ').find(c => c.startsWith('mantine-')),
      ariaHidden: rt.getAttribute('aria-hidden'),
      inert: rt.hasAttribute('inert'),
      buttons: [...rt.querySelectorAll('button')].map(b => (b.innerText || b.getAttribute('aria-label') || '').trim()).filter(Boolean),
    })))
    const dialogsExposed = await page.getByRole('dialog').count()
    const buttonsExposed = await page.getByRole('button').evaluateAll(bs => bs.map(b => (b.innerText || b.getAttribute('aria-label') || '').trim()))
    await page.screenshot({ path: OUT.replace('r4-probe.json', `r4-ac30-${id.split('--')[0].replace('patterns-mantine-', '')}-${width}.png`) })
    out.rows.push({ probe: 'AC30', id, width, roots, dialogsExposed, buttonsExposed })
    console.log('AC30', id, width, 'roots', JSON.stringify(roots.map(x => ({ c: x.cls, h: x.ariaHidden, i: x.inert, b: x.buttons.length }))), 'dialogs exposed', dialogsExposed, 'buttons exposed', buttonsExposed.length)
    await ctx.close()
  }
}

// 4. Lightbox fullScreen radius (blast radius of the Modal radius default)
{
  const { ctx, page } = await open('mantine-primitives-lightboxview--default', 1440)
  if (!(await page.locator('.mantine-Modal-content').count())) { await page.locator('button, img').first().click().catch(() => null); await page.waitForTimeout(1200) }
  const r = await page.evaluate(() => { const c = document.querySelector('.mantine-Modal-content'); return c ? getComputedStyle(c).borderTopLeftRadius : null })
  out.rows.push({ probe: 'lightbox-radius', r })
  console.log('lightbox content radius', r)
  await ctx.close()
}

// 5. Bottom-sheet consumers (blast radius of bottomSheetDrawerStyles)
for (const id of ['mantine-primitives-responsivebottomsheet--default', 'primitives-select--mobile-bottom-sheet', 'mantine-primitives-select--default']) {
  const { ctx, page } = await open(id, 390)
  if (!(await page.locator('.mantine-Drawer-content').count())) { await page.locator('button, input').first().click().catch(() => null); await page.waitForTimeout(1200) }
  const r = await page.evaluate(() => { const c = document.querySelector('.mantine-Drawer-content'); return c ? getComputedStyle(c).borderTopLeftRadius : null })
  out.rows.push({ probe: 'sheet-radius', id, r })
  console.log('sheet', id, r)
  await ctx.close()
}

fs.writeFileSync(OUT, JSON.stringify(out, null, 1))
await browser.close()
server.close()
