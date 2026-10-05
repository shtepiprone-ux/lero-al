// Task 741 Revision 3i review — GR-7 live check (Opus) of the reference pages this review relies on: card root and the
// labels placed on a card photo (position, radius, effective opacity), at 1440 and 390, with full-page screenshots.
import { createRequire } from 'node:module'
import { writeFile, mkdir } from 'node:fs/promises'
const require = createRequire('C:/Claude_Code_Projects/lero-al/package.json')
const { chromium } = require('playwright')
const D = 'docs/sessions/evidence/task741r3/rev3j/review/research-review/'
await mkdir(D + 'shots', { recursive: true })
const PAGES = [
  ['lahomes-property-grid', 'https://techzaa.in/lahomes/admin/property-grid.html'],
  ['omah-property-list', 'https://omah.dexignzone.com/xhtml/property-list.html'],
  ['omah-ecom-product-grid', 'https://omah.dexignzone.com/xhtml/ecom-product-grid.html'],
  ['tailadmin-cards', 'https://demo.tailadmin.com/cards'],
  ['tailadmin-badge', 'https://demo.tailadmin.com/badge'],
  ['kamr-ecom-product-grid', 'https://kamr-vite.vercel.app/ecom-product-grid'],
]
const browser = await chromium.launch()
const out = { platform: process.platform, at: new Date().toISOString(), pages: {} }
for (const w of [1440, 390]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 } })
  const p = await ctx.newPage()
  // Kamr login (public demo account, golden-rules GR-7)
  try {
    await p.goto('https://kamr-vite.vercel.app/auth/login', { waitUntil: 'networkidle', timeout: 45000 })
    await p.fill('input[type="email"]', 'demo@example.com'); await p.fill('input[type="password"]', '123456')
    await Promise.all([p.waitForLoadState('networkidle').catch(() => null), p.click('button[type="submit"]')]); await p.waitForTimeout(2500)
  } catch (e) { out.kamrLogin = String(e.message).slice(0, 120) }
  for (const [k, url] of PAGES) {
    const rec = { url }
    try {
      await p.goto(url, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => null); await p.waitForTimeout(2000)
      rec.finalUrl = p.url(); rec.title = await p.title()
      await p.screenshot({ path: `${D}shots/${k}-${w}.jpg`, fullPage: true, type: 'jpeg', quality: 60 })
      rec.found = await p.evaluate(() => {
        const eff = el => { let o = 1; for (let n = el; n && n.nodeType === 1; n = n.parentElement) o *= parseFloat(getComputedStyle(n).opacity); return Math.round(o * 100) / 100 }
        const cards = [...document.querySelectorAll('div,article,a')].filter(d => { const q = d.getBoundingClientRect(), s = getComputedStyle(d); return d.querySelector('img') && q.width > 150 && q.width < 700 && q.height > 150 && (parseFloat(s.borderTopLeftRadius) > 0 || s.borderTopWidth !== '0px') }).slice(0, 4)
        const labels = [...document.querySelectorAll('span,div,a,p')].filter(e => { const s = getComputedStyle(e), q = e.getBoundingClientRect(); return s.position === 'absolute' && q.width > 10 && q.width < 220 && q.height > 10 && q.height < 48 && e.textContent.trim().length > 1 && e.textContent.trim().length < 30 && e.closest('div')?.parentElement?.querySelector('img') }).slice(0, 6)
        const badges = [...document.querySelectorAll('span')].filter(e => /badge|rounded-full/.test(e.className) && e.getBoundingClientRect().width > 0).slice(0, 6)
        const d = e => { const s = getComputedStyle(e), q = e.getBoundingClientRect(); return { text: e.textContent.trim().slice(0, 30), cls: String(e.className).slice(0, 90), radius: s.borderTopLeftRadius, border: `${s.borderTopWidth} ${s.borderTopColor}`, bg: s.backgroundColor, fs: s.fontSize, h: Math.round(q.height), effOpacity: eff(e), filter: s.filter } }
        return { cards: cards.map(d), labelsOnPhoto: labels.map(d), badges: badges.map(d) }
      })
    } catch (e) { rec.error = String(e.message).slice(0, 140) }
    out.pages[`${k}@${w}`] = rec
  }
  await ctx.close()
}
await browser.close()
await writeFile(D + 'gr7-review-3j.json', JSON.stringify(out, null, 1) + '\n')
for (const [k, v] of Object.entries(out.pages)) console.log(k, v.finalUrl, '| cards', v.found?.cards?.length, v.found?.cards?.[0]?.radius, v.found?.cards?.[0]?.border, '| labels', JSON.stringify(v.found?.labelsOnPhoto?.map(l => [l.text, l.radius, l.effOpacity])), '| badges', JSON.stringify(v.found?.badges?.slice(0, 3).map(l => [l.text, l.radius, l.effOpacity])), v.error ?? '')
