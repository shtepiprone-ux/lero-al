// Task 859 review 8 (Opus) — GR-7 live research, second pass: the references' *scrollable* dialog pattern.
// (a) DOM: every `.modal-dialog-scrollable` on Lahomes / Kamr / Omah modal pages and the computed overflow-y of its
//     .modal-content / .modal-header / .modal-body / .modal-footer (Bootstrap 5: only .modal-body scrolls).
// (b) Operate Lahomes "Vertically centered scrollable modal" at 1440x420 and 390x420 so it overflows; record the
//     element that actually scrolls and whether the header/footer are inside it. Screenshot each.
// (c) TailAdmin /modals: open each "Open Modal" at 1440x420 and record the same.
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const require = createRequire('C:/Claude_Code_Projects/lero-al/package.json')
const { chromium } = require('playwright')
const DIR = path.dirname(fileURLToPath(import.meta.url))
const browser = await chromium.launch()
const results = []
const domCheck = () => [...document.querySelectorAll('.modal-dialog-scrollable')].map(d => {
  const ov = sel => { const el = d.querySelector(sel); return el ? getComputedStyle(el).overflowY : null }
  return { id: d.closest('.modal')?.id ?? null, content: ov('.modal-content'), header: ov('.modal-header'), body: ov('.modal-body'), footer: ov('.modal-footer') }
})
const scrollMeasure = () => {
  const vis = el => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' }
  const dlg = [...document.querySelectorAll('.modal.show .modal-content, [role=dialog]')].filter(vis).pop()
  if (!dlg) return { opened: false }
  const header = dlg.querySelector('.modal-header, h1, h2, h3, h4, h5'); const footer = dlg.querySelector('.modal-footer')
  const all = [dlg, ...dlg.querySelectorAll('*')]
  for (let el = dlg.parentElement; el && el !== document.documentElement; el = el.parentElement) all.push(el)
  return { opened: true, scrollers: all.filter(el => /(auto|scroll)/.test(getComputedStyle(el).overflowY) && el.scrollHeight > el.clientHeight + 1).map(el => ({ cls: el.className.toString().slice(0, 70), clientH: el.clientHeight, scrollH: el.scrollHeight, holdsHeader: !!header && el.contains(header), holdsFooter: !!footer && el.contains(footer) })) }
}
for (const [ref, url] of [['lahomes', 'https://techzaa.in/lahomes/admin/ui-modal.html'], ['kamr', 'https://kamr-vite.vercel.app/ui-modal'], ['omah', 'https://omah.dexignzone.com/xhtml/ui-modal.html']]) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } }); const page = await ctx.newPage()
  try { await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 }); results.push({ ref, url, kind: 'dom', finalUrl: page.url(), scrollableDialogs: await page.evaluate(domCheck) }) }
  catch (e) { results.push({ ref, url, kind: 'dom', error: String(e.message).slice(0, 160) }) }
  await ctx.close()
}
for (const w of [1440, 390]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 420 } }); const page = await ctx.newPage()
  await page.goto('https://techzaa.in/lahomes/admin/ui-modal.html', { waitUntil: 'networkidle', timeout: 60000 })
  const trig = page.getByRole('button', { name: 'Vertically centered scrollable modal' }).first()
  await trig.scrollIntoViewIfNeeded(); await trig.click(); await page.waitForTimeout(1000)
  const m = await page.evaluate(scrollMeasure)
  const shot = `r8-modal-scroll2-lahomes-scrollable-${w}.png`; await page.screenshot({ path: path.join(DIR, shot) })
  results.push({ ref: 'lahomes', kind: 'operated', trigger: 'Vertically centered scrollable modal', w, h: 420, shot, ...m })
  await ctx.close()
}
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 420 } }); const page = await ctx.newPage()
  await page.goto('https://demo.tailadmin.com/modals', { waitUntil: 'networkidle', timeout: 60000 })
  const n = await page.getByRole('button', { name: /open modal/i }).count()
  for (let i = 0; i < n; i++) {
    const b = page.getByRole('button', { name: /open modal/i }).nth(i)
    await b.scrollIntoViewIfNeeded(); await b.click().catch(() => null); await page.waitForTimeout(900)
    const m = await page.evaluate(() => {
      const vis = el => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.display !== 'none' && s.visibility !== 'hidden' }
      const overlays = [...document.querySelectorAll('div')].filter(el => getComputedStyle(el).position === 'fixed' && vis(el) && el.getBoundingClientRect().width >= innerWidth - 1 && el.querySelector('h4, h3, h2'))
      const ov = overlays.pop(); if (!ov) return { opened: false }
      const title = ov.querySelector('h4, h3, h2'); const btns = [...ov.querySelectorAll('button')].filter(vis); const last = btns[btns.length - 1]
      const all = [ov, ...ov.querySelectorAll('*')]
      return { opened: true, title: title?.textContent.trim().slice(0, 40), scrollers: all.filter(el => /(auto|scroll)/.test(getComputedStyle(el).overflowY) && el.scrollHeight > el.clientHeight + 1).map(el => ({ cls: el.className.toString().slice(0, 80), clientH: el.clientHeight, scrollH: el.scrollHeight, holdsTitle: el.contains(title), holdsLastButton: !!last && el.contains(last) })) }
    })
    const shot = `r8-modal-scroll2-tailadmin-1440x420-${i}.png`; await page.screenshot({ path: path.join(DIR, shot) })
    results.push({ ref: 'tailadmin', kind: 'operated', trigger: `Open Modal #${i}`, w: 1440, h: 420, shot, ...m })
    await page.keyboard.press('Escape'); await page.waitForTimeout(300)
    const close = page.locator('button:has-text("Close")').filter({ visible: true }).first()
    if (await close.count()) await close.click().catch(() => null)
    await page.waitForTimeout(400)
  }
  await ctx.close()
}
await browser.close()
fs.writeFileSync(path.join(DIR, 'r8-modal-scroll-live2.json'), JSON.stringify({ checkedAt: new Date().toISOString(), platform: process.platform, node: process.version, results }, null, 1))
for (const r of results) console.log(JSON.stringify(r).slice(0, 700))
