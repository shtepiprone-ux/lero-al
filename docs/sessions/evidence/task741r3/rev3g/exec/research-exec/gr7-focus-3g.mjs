// Task 741 Rev 3g — GR-7: paginator items and the REAL keyboard focus ring (Tab until a page-number control is focused).
import { createRequire } from 'node:module'
import { writeFileSync } from 'node:fs'
const require = createRequire('C:/Claude_Code_Projects/lero-al/package.json')
const { chromium } = require('playwright')
const D = 'docs/sessions/evidence/task741r3/rev3g/exec/research-exec/'
const PAGES = [['kamr', 'https://kamr-vite.vercel.app/ui-pagination'], ['tailadmin', 'https://demo.tailadmin.com/pagination'], ['lahomes', 'https://techzaa.in/lahomes/admin/ui-pagination.html']]
const browser = await chromium.launch()
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })).newPage()
let kamrIn = false
const out = []
for (const [ref, url] of PAGES) for (const w of [1440, 390]) {
  await page.setViewportSize({ width: w, height: w === 390 ? 844 : 900 })
  await page.goto(url, { waitUntil: 'load', timeout: 40000 }).catch(() => null)
  if (ref === 'kamr' && !kamrIn) { kamrIn = true; await page.waitForTimeout(2000); await page.locator('input[type=email]').first().fill('demo@example.com').catch(() => null); await page.locator('input[type=password]').first().fill('123456').catch(() => null); await page.locator('button[type=submit]').first().click().catch(() => null); await page.waitForURL(u => !/login/.test(String(u)), { timeout: 20000 }).catch(() => null); await page.goto(url, { waitUntil: 'load' }).catch(() => null) }
  await page.waitForTimeout(1500)
  const row = await page.evaluate(() => {
    const vis = e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 }
    const nxt = [...document.querySelectorAll('a,button')].filter(vis).find(e => /^\s*(next|наступна)\s*$/i.test(e.textContent || '') || /next/i.test(e.getAttribute('aria-label') || ''))
    let box = nxt?.parentElement; for (let i = 0; i < 3 && box && box.innerText.replace(/\s+/g, '').length < 5; i++) box = box.parentElement
    return { text: box ? box.innerText.replace(/\s+/g, ' ').slice(0, 90) : null }
  })
  let focus = null
  for (let k = 0; k < 120; k++) {
    await page.keyboard.press('Tab')
    const f = await page.evaluate(() => { const e = document.activeElement; if (!e || !/^\d+$/.test((e.textContent || '').trim())) return null; const s = getComputedStyle(e); const r = e.getBoundingClientRect(); return { text: e.textContent.trim(), fv: e.matches(':focus-visible'), outline: `${s.outlineWidth} ${s.outlineStyle} ${s.outlineColor} off ${s.outlineOffset}`, shadow: s.boxShadow.slice(0, 90), r: { x: r.x, y: r.y, w: r.width, h: r.height } } })
    if (f) { focus = f; break }
  }
  if (focus) await page.screenshot({ path: `${D}focus-${ref}-${w}.png`, clip: { x: Math.max(0, focus.r.x - 30), y: Math.max(0, focus.r.y - 20), width: 160, height: focus.r.h + 40 } })
  out.push({ ref, w, row: row.text, focus }); console.log(ref, w, JSON.stringify(row.text), JSON.stringify(focus && { ...focus, r: undefined }))
}
writeFileSync(D + 'gr7-focus-3g.json', JSON.stringify(out, null, 1)); await browser.close()
